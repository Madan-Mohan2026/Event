import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { logAdminAction } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateQRToken } from '../services/qrCode.service';

export const checkSetupStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const adminCount = await User.countDocuments({ role: 'super_admin' });
    res.status(200).json({ isSetupRequired: adminCount === 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check system setup status.' });
  }
};

export const setupSuperAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required.' });
      return;
    }

    // Double check if any admin exists
    const adminCount = await User.countDocuments({ role: 'super_admin' });
    if (adminCount > 0) {
      res.status(400).json({ error: 'System is already setup. Cannot create additional super admins.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: username,
      username,
      email,
      passwordHash,
      role: 'super_admin',
      status: 'active',
    });

    await newUser.save();

    await logAdminAction(
      newUser._id,
      newUser.username,
      'SETUP_SYSTEM',
      'Initial system setup and Super Admin account creation.',
      req.ip || 'unknown'
    );

    res.status(201).json({ message: 'Super Admin registered successfully. Please login.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to complete system setup.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const identifier = req.body.usernameOrEmail || req.body.username || req.body.email;
    const password = req.body.password;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username or email, and password are required.' });
      return;
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: String(identifier).toLowerCase() }
      ]
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_government_key_12345';
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '8h' }
    );

    await logAdminAction(
      user._id,
      user.username,
      'LOGIN',
      'Successful administrator login.',
      req.ip || 'unknown'
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to authenticate user.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve current user status.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/qr-login
// QR-authenticated login — validates QR token then standard credentials.
// Returns the same JWT structure as regular login (fully compatible).
// ─────────────────────────────────────────────────────────────────────────────
export const qrLogin = async (req: Request, res: Response): Promise<void> => {
  const ipAddress = req.ip || 'unknown';
  try {
    const { qrToken, email, password } = req.body;

    if (!qrToken || !email || !password) {
      res.status(400).json({ error: 'qrToken, email, and password are required.' });
      return;
    }

    // ── Step 1: Validate QR token against MongoDB ──
    const qrResult = await validateQRToken(qrToken);
    if (!qrResult.valid || !qrResult.qrRecord) {
      await logAdminAction(undefined, email, 'QR_LOGIN_FAILED', `Invalid/revoked QR: ${qrResult.error}`, ipAddress);
      res.status(401).json({ error: qrResult.error || 'Invalid QR code.' });
      return;
    }

    const { qrRecord } = qrResult;

    // ── Step 2: Validate admin credentials ──
    const user = await User.findOne({
      $or: [
        { email: String(email).toLowerCase() },
        { username: email }
      ]
    });

    if (!user) {
      await logAdminAction(undefined, email, 'QR_LOGIN_FAILED', 'Admin not found.', ipAddress);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAdminAction(user._id, user.username, 'QR_LOGIN_FAILED', 'Wrong password.', ipAddress);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // ── Step 3: Verify the QR belongs to this admin ──
    if (String(qrRecord.adminId) !== String(user._id)) {
      await logAdminAction(user._id, user.username, 'QR_LOGIN_FAILED', 'QR belongs to a different admin.', ipAddress);
      res.status(403).json({ error: 'This QR code is not assigned to your account.' });
      return;
    }

    // ── Step 4: Verify admin is active ──
    if (user.status !== 'active') {
      await logAdminAction(user._id, user.username, 'QR_LOGIN_FAILED', 'Admin account is inactive.', ipAddress);
      res.status(403).json({ error: 'Your account has been deactivated. Contact Super Admin.' });
      return;
    }

    // ── Step 5: Verify event is still assigned ──
    const assignedIds: string[] = [];
    if (user.assignedEventIds && user.assignedEventIds.length > 0) assignedIds.push(...user.assignedEventIds);
    if (user.assignedEventId) assignedIds.push(user.assignedEventId);

    if (!assignedIds.includes(qrRecord.eventId)) {
      await logAdminAction(user._id, user.username, 'QR_LOGIN_FAILED', `Event ${qrRecord.eventId} is no longer assigned.`, ipAddress);
      res.status(403).json({ error: 'This event is no longer assigned to your account. QR code is invalid.' });
      return;
    }

    // ── Step 6: Issue JWT (same shape as regular login) ──
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_government_key_12345';
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '8h' }
    );

    await logAdminAction(
      user._id,
      user.username,
      'QR_LOGIN',
      `Successful QR-authenticated login for event ${qrRecord.eventId}.`,
      ipAddress
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        assignedEventId: qrRecord.eventId,         // pre-select the scanned event
        assignedEventIds: user.assignedEventIds || [],
      },
      scannedEventId: qrRecord.eventId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'QR login failed.' });
  }
};

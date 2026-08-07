import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { logAdminAction } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateAndSaveQR, invalidateQR } from '../services/qrCode.service';

// GET /api/users — List all admin users
export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawUsers = await User.find().select('-passwordHash').sort({ createdAt: 1 }).lean();

    const users = rawUsers.map((u: any) => {
      if (!u.fullName || u.fullName.trim() === '') {
        u.fullName = u.username;
      }
      return u;
    });

    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users.' });
  }
};

// POST /api/users — Create a new admin user (super_admin only)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super admins can create users.' });
      return;
    }

    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({ error: 'fullName, email, password, and role are required.' });
      return;
    }

    const allowedRoles = ['super_admin', 'admin', 'staff'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
      return;
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'A user with that email already exists.' });
      return;
    }

    // Generate a username from email prefix
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: 'active',
    });

    await newUser.save();

    await logAdminAction(
      req.user.id,
      req.user.username,
      'CREATE_USER',
      `Created user ${email} with role ${role}.`,
      req.ip || 'unknown'
    );

    const userOut = await User.findById(newUser._id).select('-passwordHash');
    res.status(201).json({ message: 'User created successfully.', user: userOut });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create user.' });
  }
};

// PATCH /api/users/:id/role — Update user role
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super admins can change roles.' });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ['super_admin', 'admin', 'staff'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    user.role = role;
    await user.save();

    await logAdminAction(
      req.user.id,
      req.user.username,
      'UPDATE_USER_ROLE',
      `Changed role of ${user.email} to ${role}.`,
      req.ip || 'unknown'
    );

    res.status(200).json({ message: 'Role updated.', user: { ...user.toObject(), passwordHash: undefined } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update role.' });
  }
};

// PATCH /api/users/:id/status — Toggle user active/inactive
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super admins can change user status.' });
      return;
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'super_admin') {
      res.status(400).json({ error: 'Cannot deactivate a super admin account.' });
      return;
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    await logAdminAction(
      req.user.id,
      req.user.username,
      'TOGGLE_USER_STATUS',
      `Set user ${user.email} status to ${user.status}.`,
      req.ip || 'unknown'
    );

    res.status(200).json({ message: `User ${user.status}.`, user: { ...user.toObject(), passwordHash: undefined } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle user status.' });
  }
};

// DELETE /api/users/:id — Delete a user
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super admins can delete users.' });
      return;
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'super_admin') {
      res.status(400).json({ error: 'Cannot delete a super admin account.' });
      return;
    }

    await User.findByIdAndDelete(id);

    await logAdminAction(
      req.user.id,
      req.user.username,
      'DELETE_USER',
      `Deleted user ${user.email}.`,
      req.ip || 'unknown'
    );

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete user.' });
  }
};

// PATCH /api/users/:id/assign-event — Assign a single event to a user (legacy)
export const assignEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    user.assignedEventId = eventId || '';
    // Also keep assignedEventIds in sync
    if (eventId) {
      if (!user.assignedEventIds) user.assignedEventIds = [];
      if (!user.assignedEventIds.includes(eventId)) {
        user.assignedEventIds.push(eventId);
      }
      const adminName = user.fullName || user.username || user.email;
      await Event.findByIdAndUpdate(eventId, { assignedAdmin: adminName });
    } else {
      if (user.assignedEventIds && user.assignedEventIds.length > 0) {
        await Event.updateMany({ _id: { $in: user.assignedEventIds } }, { assignedAdmin: 'Unassigned (Super Admin Only)' });
      }
      user.assignedEventIds = [];
    }
    await user.save();

    const superAdminUsername = req.user?.username || 'system';

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'ASSIGN_EVENT',
        `Assigned event ${eventId} to user ${user.email}.`,
        req.ip || 'unknown'
      );
    }

    // ── Auto-generate QR code for this assignment ──
    let qrDataUrl: string | null = null;
    if (eventId) {
      try {
        const qrResult = await generateAndSaveQR(String(user._id), eventId, superAdminUsername);
        qrDataUrl = qrResult.qrDataUrl;
      } catch (qrErr: any) {
        console.error('[QR] Failed to generate QR after assign-event:', qrErr.message);
      }
    }

    res.status(200).json({
      message: 'Event assigned.',
      user: { ...user.toObject(), passwordHash: undefined },
      qrDataUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to assign event.' });
  }
};

// PATCH /api/users/:id/assign-events — Assign multiple events to an admin
export const assignEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { eventIds } = req.body; // array of event IDs

    if (!Array.isArray(eventIds)) {
      res.status(400).json({ error: 'eventIds must be an array.' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const previousEventIds: string[] = user.assignedEventIds || [];
    const superAdminUsername = req.user?.username || 'system';

    user.assignedEventIds = eventIds;
    // Keep legacy field synced to first event
    user.assignedEventId = eventIds[0] || '';
    await user.save();

    // ── Sync Event documents in MongoDB ──
    const adminName = user.fullName || user.username || user.email || 'Admin';
    if (eventIds.length > 0) {
      await Event.updateMany({ _id: { $in: eventIds } }, { assignedAdmin: adminName });
    }
    const removedEventIds = previousEventIds.filter(eid => !eventIds.includes(eid));
    if (removedEventIds.length > 0) {
      await Event.updateMany({ _id: { $in: removedEventIds } }, { assignedAdmin: 'Unassigned (Super Admin Only)' });
    }

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'ASSIGN_EVENTS',
        `Assigned ${eventIds.length} event(s) to user ${user.email}.`,
        req.ip || 'unknown'
      );
    }

    // ── Invalidate QRs for removed events ──
    for (const eid of removedEventIds) {
      try {
        await invalidateQR(String(user._id), eid, superAdminUsername);
      } catch (qrErr: any) {
        console.error('[QR] Failed to invalidate QR for removed event:', qrErr.message);
      }
    }

    // ── Auto-generate QRs for newly added events ──
    const newEventIds = eventIds.filter((eid: string) => !previousEventIds.includes(eid));
    const qrResults: { eventId: string; qrDataUrl: string }[] = [];
    for (const eid of newEventIds) {
      try {
        const qrResult = await generateAndSaveQR(String(user._id), eid, superAdminUsername);
        qrResults.push({ eventId: eid, qrDataUrl: qrResult.qrDataUrl });
      } catch (qrErr: any) {
        console.error('[QR] Failed to generate QR after assign-events:', qrErr.message);
      }
    }

    res.status(200).json({
      message: 'Events assigned.',
      user: { ...user.toObject(), passwordHash: undefined },
      qrResults,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to assign events.' });
  }
};


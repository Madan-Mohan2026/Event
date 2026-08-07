import { Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  generateAndSaveQR,
  getQRForAdmin,
  validateQRToken,
} from '../services/qrCode.service';
import { logAdminAction } from '../services/audit.service';
import { generateQrDataUrl, getLocalIpAddress } from '../utils/qr.utils';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/qr/:adminId — list all QR tokens for a given admin
// Super Admin only
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminQRCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;

    if (!Types.ObjectId.isValid(adminId)) {
      res.status(400).json({ error: 'Invalid adminId.' });
      return;
    }

    const admin = await User.findById(adminId).select('-passwordHash').lean();
    if (!admin) {
      res.status(404).json({ error: 'Admin user not found.' });
      return;
    }

    const qrRecords = await getQRForAdmin(adminId);

    // Enrich with event titles
    const eventIds = qrRecords.map(r => r.eventId);
    const events = await Event.find({ _id: { $in: eventIds } }).select('title').lean();
    const eventMap = new Map(events.map(e => [String(e._id), (e as any).title]));

    const enriched = await Promise.all(qrRecords.map(async r => {
      const lanIp = getLocalIpAddress();
      const currentUrl = `http://${lanIp}:5173/#login?qrToken=${encodeURIComponent(r.encryptedToken)}`;
      const liveQrDataUrl = await generateQrDataUrl(currentUrl);

      return {
        _id: (r as any)._id,
        adminId: r.adminId,
        eventId: r.eventId,
        eventTitle: eventMap.get(r.eventId) || r.eventId,
        isActive: r.isActive,
        qrDataUrl: liveQrDataUrl,
        createdAt: (r as any).createdAt,
        updatedAt: (r as any).updatedAt,
      };
    }));

    res.status(200).json({ admin, qrCodes: enriched });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch QR codes.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/qr/:adminId/:eventId — get QR for specific admin+event
// Super Admin only
// ─────────────────────────────────────────────────────────────────────────────
export const getQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { adminId, eventId } = req.params;

    if (!Types.ObjectId.isValid(adminId)) {
      res.status(400).json({ error: 'Invalid adminId.' });
      return;
    }

    const records = await getQRForAdmin(adminId, eventId);
    if (!records || records.length === 0) {
      res.status(404).json({ error: 'QR code not found for this admin/event combination.' });
      return;
    }

    const rec = records[0];
    const lanIp = getLocalIpAddress();
    const currentUrl = `http://${lanIp}:5173/#login?qrToken=${encodeURIComponent(rec.encryptedToken)}`;
    const liveQrDataUrl = await generateQrDataUrl(currentUrl);

    await logAdminAction(
      req.user!.id,
      req.user!.username,
      'QR_VIEWED',
      `Viewed QR for admin ${adminId} / event ${eventId}.`,
      req.ip || 'unknown'
    );

    res.status(200).json({ qrCode: { ...rec, qrDataUrl: liveQrDataUrl } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch QR code.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/qr/regenerate — regenerate QR for a given adminId+eventId
// Body: { adminId, eventId }
// Super Admin only
// ─────────────────────────────────────────────────────────────────────────────
export const regenerateQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { adminId, eventId } = req.body;

    if (!adminId || !eventId) {
      res.status(400).json({ error: 'adminId and eventId are required.' });
      return;
    }
    if (!Types.ObjectId.isValid(adminId)) {
      res.status(400).json({ error: 'Invalid adminId.' });
      return;
    }

    const admin = await User.findById(adminId).select('username assignedEventIds assignedEventId status').lean();
    if (!admin) {
      res.status(404).json({ error: 'Admin user not found.' });
      return;
    }
    if (admin.status !== 'active') {
      res.status(400).json({ error: 'Cannot regenerate QR for an inactive admin.' });
      return;
    }

    // Verify event is still assigned
    const ids: string[] = [];
    if (admin.assignedEventIds && admin.assignedEventIds.length > 0) ids.push(...admin.assignedEventIds);
    if (admin.assignedEventId) ids.push(admin.assignedEventId);

    if (!ids.includes(eventId)) {
      res.status(400).json({ error: 'Event is not assigned to this admin. Cannot regenerate QR.' });
      return;
    }

    const { qrDataUrl, encryptedToken } = await generateAndSaveQR(
      adminId,
      eventId,
      req.user!.username
    );

    await logAdminAction(
      req.user!.id,
      req.user!.username,
      'QR_REGENERATED',
      `QR regenerated for admin ${adminId} / event ${eventId}.`,
      req.ip || 'unknown'
    );

    res.status(200).json({ message: 'QR code regenerated.', qrDataUrl, encryptedToken });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to regenerate QR code.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/qr/validate?token=... — validate a QR token (used by frontend health check)
// Public endpoint (no auth required) – returns minimal info only
// ─────────────────────────────────────────────────────────────────────────────
export const validateQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ valid: false, error: 'Token is required.' });
      return;
    }

    const result = await validateQRToken(token);
    if (!result.valid) {
      res.status(200).json({ valid: false, error: result.error });
      return;
    }

    res.status(200).json({ valid: true, eventId: result.qrRecord!.eventId });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message || 'Validation error.' });
  }
};

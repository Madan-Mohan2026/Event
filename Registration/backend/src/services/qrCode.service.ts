import { Types } from 'mongoose';
import { QRToken, IQRToken } from '../models/qrToken.model';
import { encryptToken, generateQrDataUrl, getLocalIpAddress } from '../utils/qr.utils';
import { logAdminAction } from './audit.service';

// ─────────────────────────────────────────────────────────────────────────────
// Build the QR URL that the phone camera will open when scanned.
// Always uses the runtime LAN IP so the QR works across IP changes.
// ─────────────────────────────────────────────────────────────────────────────
function buildQrUrl(encryptedToken: string): string {
  const lanIp = getLocalIpAddress();
  const frontendPort = 5173;
  const baseUrl = `http://${lanIp}:${frontendPort}`;
  return `${baseUrl}/#login?qrToken=${encodeURIComponent(encryptedToken)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate and persist (or replace) a QR token for an admin+event pair.
// Called automatically from user.controller when an event is assigned.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateAndSaveQR(
  adminId: string | Types.ObjectId,
  eventId: string,
  adminUsername: string
): Promise<{ qrDataUrl: string; encryptedToken: string }> {
  const adminIdStr = String(adminId);

  // Build secure payload
  const payload = {
    adminId: adminIdStr,
    eventId,
    createdAt: new Date().toISOString(),
    nonce: Math.random().toString(36).slice(2) + Date.now().toString(36),
  };

  const encryptedToken = encryptToken(payload);
  const qrUrl = buildQrUrl(encryptedToken);
  const qrDataUrl = await generateQrDataUrl(qrUrl);

  // Upsert: one QR per admin+event (replace if regenerating)
  await QRToken.findOneAndUpdate(
    { adminId: new Types.ObjectId(adminIdStr), eventId },
    {
      adminId: new Types.ObjectId(adminIdStr),
      eventId,
      encryptedToken,
      isActive: true,
      qrDataUrl,
    },
    { upsert: true, new: true }
  );

  await logAdminAction(
    adminId,
    adminUsername,
    'QR_GENERATED',
    `QR code generated for admin ${adminIdStr} / event ${eventId}.`,
    'system'
  );

  return { qrDataUrl, encryptedToken };
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidate all QR tokens for an admin+event when the assignment is removed.
// ─────────────────────────────────────────────────────────────────────────────
export async function invalidateQR(
  adminId: string | Types.ObjectId,
  eventId: string,
  adminUsername: string
): Promise<void> {
  await QRToken.updateMany(
    { adminId: new Types.ObjectId(String(adminId)), eventId },
    { isActive: false }
  );

  await logAdminAction(
    adminId,
    adminUsername,
    'QR_INVALIDATED',
    `QR code invalidated for admin ${adminId} / event ${eventId}.`,
    'system'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidate ALL QR tokens for a given admin (e.g. admin deactivated)
// ─────────────────────────────────────────────────────────────────────────────
export async function invalidateAllQRsForAdmin(
  adminId: string | Types.ObjectId,
  adminUsername: string
): Promise<void> {
  await QRToken.updateMany(
    { adminId: new Types.ObjectId(String(adminId)) },
    { isActive: false }
  );

  await logAdminAction(
    adminId,
    adminUsername,
    'QR_ALL_INVALIDATED',
    `All QR codes invalidated for admin ${adminId}.`,
    'system'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Retrieve QR tokens for a given admin (optionally filtered by event)
// ─────────────────────────────────────────────────────────────────────────────
export async function getQRForAdmin(
  adminId: string | Types.ObjectId,
  eventId?: string
): Promise<IQRToken[]> {
  const filter: any = { adminId: new Types.ObjectId(String(adminId)) };
  if (eventId) filter.eventId = eventId;
  return QRToken.find(filter).sort({ createdAt: -1 }).lean() as any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate an encrypted QR token from a scan.
// Returns the QRToken document if valid, or an error string.
// ─────────────────────────────────────────────────────────────────────────────
export async function validateQRToken(
  encryptedToken: string
): Promise<{ valid: boolean; qrRecord?: IQRToken; error?: string }> {
  if (!encryptedToken) {
    return { valid: false, error: 'QR token is missing.' };
  }

  const qrRecord = await QRToken.findOne({ encryptedToken }).lean() as IQRToken | null;

  if (!qrRecord) {
    return { valid: false, error: 'Invalid QR code. Token not found.' };
  }

  if (!qrRecord.isActive) {
    return { valid: false, error: 'This QR code has been revoked. Assignment may have been removed.' };
  }

  return { valid: true, qrRecord };
}

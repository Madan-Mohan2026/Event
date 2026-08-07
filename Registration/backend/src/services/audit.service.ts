import { AuditLog } from '../models/auditLog.model';
import { Types } from 'mongoose';

export const logAdminAction = async (
  adminId: string | Types.ObjectId | undefined,
  adminUsername: string,
  action: string,
  details: any,
  ipAddress: string
): Promise<void> => {
  try {
    const detailsString = typeof details === 'string' ? details : JSON.stringify(details);
    const log = new AuditLog({
      adminId,
      adminUsername,
      action,
      details: detailsString,
      ipAddress: ipAddress || 'unknown'
    });
    await log.save();
  } catch (error) {
    console.error('[audit]: Failed to write audit log:', error);
  }
};

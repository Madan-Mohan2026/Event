import { EventLog, IEventLog } from '../models/eventLog.model';
import { broadcastRealtimeEvent } from './realtime.service';
import { Types } from 'mongoose';

export interface RecordEventActionParams {
  eventId?: string | Types.ObjectId;
  registrationId?: string;
  participantName?: string;
  registeredMobileNumber?: string;
  actionType: 'Attendance' | 'Spot Registration' | 'Kit Issued' | 'Food Redeemed' | 'Mobile Verification' | 'Kit Scan' | 'Food Scan';
  actionStatus: 'Success' | 'Failed' | 'Already Issued' | 'Already Redeemed' | 'Registration Not Found' | 'Invalid Mobile' | 'Duplicate Scan';
  adminId?: string | Types.ObjectId;
  adminUsername?: string;
  details?: string;
}

export const recordEventAction = async (params: RecordEventActionParams): Promise<IEventLog | null> => {
  try {
    const validEventId = params.eventId && Types.ObjectId.isValid(params.eventId) ? new Types.ObjectId(params.eventId) : undefined;
    const validAdminId = params.adminId && Types.ObjectId.isValid(params.adminId) ? new Types.ObjectId(params.adminId) : undefined;

    const log = new EventLog({
      eventId: validEventId,
      registrationId: params.registrationId || '',
      participantName: params.participantName || 'N/A',
      registeredMobileNumber: params.registeredMobileNumber || '',
      actionType: params.actionType,
      actionStatus: params.actionStatus,
      dateTime: new Date(),
      adminId: validAdminId,
      adminUsername: params.adminUsername || '',
      details: params.details || ''
    });

    await log.save();

    // Broadcast live event update to all connected dashboard clients via SSE
    broadcastRealtimeEvent('STATS_UPDATED', {
      action: params.actionType,
      status: params.actionStatus,
      eventId: params.eventId,
      registrationId: params.registrationId,
      participantName: params.participantName,
      timestamp: Date.now()
    });

    return log;
  } catch (error: any) {
    console.error('[eventLog.service]: Failed to record event action log:', error.message);
    return null;
  }
};

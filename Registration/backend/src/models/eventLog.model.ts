import { Schema, model, Document, Types } from 'mongoose';

export interface IEventLog extends Document {
  eventId?: Types.ObjectId;
  registrationId?: string;
  participantName?: string;
  registeredMobileNumber?: string;
  actionType: 'Attendance' | 'Spot Registration' | 'Kit Issued' | 'Food Redeemed' | 'Mobile Verification' | 'Kit Scan' | 'Food Scan';
  actionStatus: 'Success' | 'Failed' | 'Already Issued' | 'Already Redeemed' | 'Registration Not Found' | 'Invalid Mobile' | 'Duplicate Scan';
  dateTime: Date;
  adminId?: Types.ObjectId;
  adminUsername?: string;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventLogSchema = new Schema<IEventLog>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    registrationId: { type: String, default: '' },
    participantName: { type: String, default: '' },
    registeredMobileNumber: { type: String, default: '' },
    actionType: {
      type: String,
      required: true,
      enum: ['Attendance', 'Spot Registration', 'Kit Issued', 'Food Redeemed', 'Mobile Verification', 'Kit Scan', 'Food Scan']
    },
    actionStatus: {
      type: String,
      required: true,
      enum: ['Success', 'Failed', 'Already Issued', 'Already Redeemed', 'Registration Not Found', 'Invalid Mobile', 'Duplicate Scan']
    },
    dateTime: { type: Date, default: Date.now },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminUsername: { type: String, default: '' },
    details: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

eventLogSchema.index({ eventId: 1, dateTime: -1 });
eventLogSchema.index({ eventId: 1, createdAt: -1 });
eventLogSchema.index({ dateTime: -1 });
eventLogSchema.index({ createdAt: -1 });
eventLogSchema.index({ registrationId: 1 });
eventLogSchema.index({ actionType: 1 });

export const EventLog = model<IEventLog>('EventLog', eventLogSchema);

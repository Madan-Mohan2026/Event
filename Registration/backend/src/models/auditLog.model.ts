import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  adminId?: Types.ObjectId;
  adminUsername: string;
  action: string;
  details: string; // JSON string or description
  ipAddress: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminUsername: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: 'unknown' },
    timestamp: { type: Date, default: Date.now }
  },
  {
    timestamps: false
  }
);

auditLogSchema.index({ timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

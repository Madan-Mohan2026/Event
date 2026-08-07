import { Schema, model, Document, Types } from 'mongoose';

export interface IQRToken extends Document {
  adminId: Types.ObjectId;
  eventId: string;
  encryptedToken: string;
  isActive: boolean;
  qrDataUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const qrTokenSchema = new Schema<IQRToken>(
  {
    adminId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId:        { type: String, required: true },
    encryptedToken: { type: String, required: true },
    isActive:       { type: Boolean, default: true },
    qrDataUrl:      { type: String, default: '' },
  },
  { timestamps: true }
);

// Unique QR per admin+event combination
qrTokenSchema.index({ adminId: 1, eventId: 1 }, { unique: true });
qrTokenSchema.index({ encryptedToken: 1 });
qrTokenSchema.index({ isActive: 1 });

export const QRToken = model<IQRToken>('QRToken', qrTokenSchema);

import { Schema, model, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
  registrationId: string;
  eventCode: string;
  eventTitle: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  participantPhoneNormalized?: string;
  eventId: Types.ObjectId;
  formData: Record<string, any>;
  registeredAt: Date;
  attended: boolean;
  attendedAt?: Date;
  attendedDate?: string;
  attendedTime?: string;
  attendedBy?: string;
  attendanceMethod?: 'QR' | 'Manual';
  kitQrToken?: string;
  kitQrCodeDataUrl?: string;
  kitQrCreatedAt?: Date;
  foodQrToken?: string;
  foodQrCodeDataUrl?: string;
  foodQrCreatedAt?: Date;
  kitIssued: boolean;
  kitIssuedAt?: Date;
  kitIssuedDate?: string;
  kitIssuedTime?: string;
  kitIssuedBy?: string;
  kitQrExpired?: boolean;
  couponIssued: boolean;
  foodIssued?: boolean;
  foodIssuedAt?: Date;
  foodIssuedBy?: string;
  foodRedeemed: boolean;
  foodRedeemedAt?: Date;
  foodRedeemedDate?: string;
  foodRedeemedTime?: string;
  foodRedeemedBy?: string;
  foodQrExpired?: boolean;
  feedback: string;
  rating?: number;
  feedbackSent?: boolean;
  category: string;
  formId?: string;
  status?: string;
  participant?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  submittedFields?: any[];
  spotRegistration?: boolean;
}

const registrationSchema = new Schema<IRegistration>(
  {
    registrationId: { type: String, default: '' },
    eventCode: { type: String, default: '' },
    eventTitle: { type: String, default: '' },
    participantName: { type: String, default: '' },
    participantEmail: { type: String, default: '' },
    participantPhone: { type: String, default: '' },
    participantPhoneNormalized: { type: String, default: '' },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    formData: { type: Schema.Types.Map, of: Schema.Types.Mixed, required: true },
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date },
    attendedDate: { type: String, default: '' },
    attendedTime: { type: String, default: '' },
    attendedBy: { type: String, default: 'Admin' },
    attendanceMethod: { type: String, enum: ['QR', 'Manual'], default: 'QR' },
    kitQrToken: { type: String, default: '' },
    kitQrCodeDataUrl: { type: String, default: '' },
    kitQrCreatedAt: { type: Date },
    foodQrToken: { type: String, default: '' },
    foodQrCodeDataUrl: { type: String, default: '' },
    foodQrCreatedAt: { type: Date },
    kitIssued: { type: Boolean, default: false },
    kitIssuedAt: { type: Date },
    kitIssuedDate: { type: String, default: '' },
    kitIssuedTime: { type: String, default: '' },
    kitIssuedBy: { type: String, default: '' },
    kitQrExpired: { type: Boolean, default: false },
    couponIssued: { type: Boolean, default: false },
    foodIssued: { type: Boolean, default: false },
    foodIssuedAt: { type: Date },
    foodIssuedBy: { type: String, default: '' },
    foodRedeemed: { type: Boolean, default: false },
    foodRedeemedAt: { type: Date },
    foodRedeemedDate: { type: String, default: '' },
    foodRedeemedTime: { type: String, default: '' },
    foodRedeemedBy: { type: String, default: '' },
    foodQrExpired: { type: Boolean, default: false },
    feedback: { type: String, default: '' },
    rating: { type: Number, default: 5 },
    feedbackSent: { type: Boolean, default: false },
    category: { type: String, default: 'General' },
    formId: { type: String, default: '' },
    status: { type: String, default: 'Registered' },
    participant: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    submittedFields: { type: Schema.Types.Mixed, default: [] },
    spotRegistration: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

registrationSchema.index({ eventId: 1 });
registrationSchema.index({ registrationId: 1 });
registrationSchema.index({ participantPhone: 1 });
registrationSchema.index({ participantEmail: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ attended: 1 });
registrationSchema.index({ kitIssued: 1 });
registrationSchema.index({ foodRedeemed: 1 });
registrationSchema.index({ couponIssued: 1 });
registrationSchema.index({ kitQrToken: 1 });
registrationSchema.index({ foodQrToken: 1 });
registrationSchema.index({ category: 1 });
registrationSchema.index({ registeredAt: -1 });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ eventId: 1, registeredAt: -1 });
registrationSchema.index({ eventId: 1, participantPhone: 1 });
registrationSchema.index(
  { eventId: 1, participantPhoneNormalized: 1 },
  { unique: true, partialFilterExpression: { participantPhoneNormalized: { $gt: '' } }, background: true }
);
registrationSchema.index({ eventId: 1, registrationId: 1 });
registrationSchema.index({ eventId: 1, attended: 1 });
registrationSchema.index({ eventId: 1, kitIssued: 1 });
registrationSchema.index({ eventId: 1, couponIssued: 1 });
registrationSchema.index({ eventId: 1, foodRedeemed: 1 });
registrationSchema.index({ eventId: 1, category: 1 });
registrationSchema.index({ eventId: 1, attended: 1, kitIssued: 1 });
registrationSchema.index({ eventId: 1, attended: 1, foodRedeemed: 1, couponIssued: 1 });

export const Registration = model<IRegistration>('Registration', registrationSchema);

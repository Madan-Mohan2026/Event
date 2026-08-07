import { Schema, model, Document, Types } from 'mongoose';

export interface IGuest extends Document {
  name: string;
  email: string;
  organization: string;
  designation: string;
  eventId: Types.ObjectId;
  status: 'invited' | 'confirmed' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    organization: { type: String, default: '' },
    designation: { type: String, default: '' },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['invited', 'confirmed', 'declined'], default: 'invited' }
  },
  {
    timestamps: true
  }
);

guestSchema.index({ eventId: 1 });

export const Guest = model<IGuest>('Guest', guestSchema);

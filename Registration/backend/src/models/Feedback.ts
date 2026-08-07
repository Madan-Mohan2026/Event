import { Schema, model, Document } from 'mongoose';

export interface IFeedbackDoc extends Document {
  eventId: Schema.Types.ObjectId;
  registrationId?: Schema.Types.ObjectId;
  rating: number;
  comments: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedbackDoc>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  registrationId: { type: Schema.Types.ObjectId, ref: 'Registration' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comments: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Feedback = model<IFeedbackDoc>('Feedback', feedbackSchema);

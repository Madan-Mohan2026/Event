import { Schema, model, Document } from 'mongoose';

export interface IAgendaSession extends Document {
  eventId: Schema.Types.ObjectId;
  timeSlot: string;
  topic: string;
  speaker: string;
  location?: string;
  createdAt: Date;
}

const agendaSchema = new Schema<IAgendaSession>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  timeSlot: { type: String, required: true },
  topic: { type: String, required: true },
  speaker: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Agenda = model<IAgendaSession>('Agenda', agendaSchema);

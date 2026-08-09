import { Schema, model, Document } from 'mongoose';

export interface IFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'dropdown' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // Used for dropdowns
}

export interface ISession {
  title: string;
  speaker: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  location: string;
  description: string;
}

export interface IEvent extends Document {
  eventCode: string;
  title: string;
  description: string;
  category: string;
  participantType?: string; // Startups, MSMEs, Students, VDP
  teamWide?: string;        // Innotribes, Innovation, Partnerships
  organizerTeam?: string;   // Amaravathi Hub, Vizag Spoke, etc.
  eventType?: string;       // VDP, Spark, Udhyam, All Event Types
  location: string;
  speakerDetails: string;
  date: Date;
  endDate?: Date;
  time: string;
  endTime?: string;
  registrationStart?: Date;
  registrationEnd?: Date;
  registrationStartTime?: string;
  registrationEndTime?: string;
  timezone?: string;
  capacity: number;
  assignedAdmin: string;
  organizerName: string;
  contactNumber: string;
  supportEmail: string;
  bannerImage: string;
  agendaPdf: string;
  status: 'draft' | 'published' | 'archived';
  assignedFormId?: string;
  formSchema: IFormField[];
  agenda: ISession[];
  foodCount: number;
  kitsCount: number;
  scansCount: number;
  checkinQrToken?: string;
  checkinQrCodeDataUrl?: string;
  checkinUrl?: string;
  kitDeskUrl?: string;
  kitQrCodeDataUrl?: string;
  foodDeskUrl?: string;
  foodQrCodeDataUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const formFieldSchema = new Schema<IFormField>({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'email', 'dropdown', 'checkbox', 'textarea'], required: true },
  required: { type: Boolean, default: false },
  options: { type: [String], default: [] }
}, { _id: false });

const sessionSchema = new Schema<ISession>({
  title: { type: String, required: true },
  speaker: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: false });

const eventSchema = new Schema<IEvent>(
  {
    eventCode: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    participantType: { type: String, default: 'Startups' },
    teamWide: { type: String, default: 'Innotribes' },
    organizerTeam: { type: String, default: 'All Teams' },
    eventType: { type: String, default: 'All Event Types' },
    location: { type: String, default: '' },
    speakerDetails: { type: String, default: '' },
    date: { type: Date, required: true },
    endDate: { type: Date },
    time: { type: String, default: '' },
    endTime: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    registrationStart: { type: Date },
    registrationEnd: { type: Date },
    registrationStartTime: { type: String, default: '' },
    registrationEndTime: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Calcutta' },
    assignedAdmin: { type: String, default: 'Unassigned (Super Admin Only)' },
    organizerName: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    agendaPdf: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    assignedFormId: { type: String, default: '' },
    formSchema: { type: [formFieldSchema], default: [] },
    agenda: { type: [sessionSchema], default: [] },
    foodCount: { type: Number, default: 0 },
    kitsCount: { type: Number, default: 0 },
    scansCount: { type: Number, default: 0 },
    checkinQrToken: { type: String, default: '' },
    checkinQrCodeDataUrl: { type: String, default: '' },
    checkinUrl: { type: String, default: '' },
    kitDeskUrl: { type: String, default: '' },
    kitQrCodeDataUrl: { type: String, default: '' },
    foodDeskUrl: { type: String, default: '' },
    foodQrCodeDataUrl: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ eventCode: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ status: 1, date: 1 });

export const Event = model<IEvent>('Event', eventSchema);

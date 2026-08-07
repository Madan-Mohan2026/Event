import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'staff';
  status: 'active' | 'inactive';
  assignedEventId?: string;       // legacy single-event
  assignedEventIds?: string[];    // multi-event support
  phone?: string;
  profilePhoto?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, trim: true, default: '' },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'staff'],
      default: 'admin',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    assignedEventId: { type: String, default: '' },
    assignedEventIds: { type: [String], default: [] },
    phone: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });

export const User = model<IUser>('User', userSchema);


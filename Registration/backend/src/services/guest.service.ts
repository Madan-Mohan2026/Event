import { Guest, IGuest } from '../models/guest.model';

export async function fetchGuestsByEvent(eventId: string): Promise<IGuest[]> {
  return await Guest.find({ eventId }).sort({ createdAt: -1 });
}

export async function createGuest(data: Partial<IGuest>): Promise<IGuest> {
  const guest = new Guest(data);
  return await guest.save();
}

export async function updateGuest(id: string, data: Partial<IGuest>): Promise<IGuest | null> {
  return await Guest.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteGuest(id: string): Promise<IGuest | null> {
  return await Guest.findByIdAndDelete(id);
}

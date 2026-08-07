import { Registration, IRegistration } from '../models/registration.model';

export async function fetchRegistrationsByEvent(eventId: string, filter: object = {}): Promise<IRegistration[]> {
  return await Registration.find({ eventId, ...filter }).sort({ createdAt: -1 });
}

export async function fetchAllRegistrations(filter: object = {}): Promise<IRegistration[]> {
  return await Registration.find(filter).sort({ createdAt: -1 });
}

export async function fetchRegistrationById(id: string): Promise<IRegistration | null> {
  return await Registration.findById(id);
}

export async function createRegistration(data: Partial<IRegistration>): Promise<IRegistration> {
  const reg = new Registration(data);
  return await reg.save();
}

export async function updateRegistrationStatus(id: string, updateData: Partial<IRegistration>): Promise<IRegistration | null> {
  return await Registration.findByIdAndUpdate(id, updateData, { new: true });
}

export async function removeRegistration(id: string): Promise<IRegistration | null> {
  return await Registration.findByIdAndDelete(id);
}

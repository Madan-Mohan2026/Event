import { Event, IEvent } from '../models/event.model';

export async function fetchAllEvents(filter: object = {}): Promise<IEvent[]> {
  return await Event.find(filter).sort({ createdAt: -1 });
}

export async function fetchEventById(id: string): Promise<IEvent | null> {
  return await Event.findById(id);
}

export async function createNewEvent(eventData: Partial<IEvent>): Promise<IEvent> {
  const newEvent = new Event(eventData);
  return await newEvent.save();
}

export async function updateEventById(id: string, updateData: Partial<IEvent>): Promise<IEvent | null> {
  return await Event.findByIdAndUpdate(id, updateData, { new: true });
}

export async function deleteEventById(id: string): Promise<IEvent | null> {
  return await Event.findByIdAndDelete(id);
}

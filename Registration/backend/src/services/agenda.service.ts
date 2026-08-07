import { Event, IEvent } from '../models/event.model';

export async function updateEventAgenda(eventId: string, agenda: any[]): Promise<IEvent | null> {
  return await Event.findByIdAndUpdate(eventId, { agenda }, { new: true });
}

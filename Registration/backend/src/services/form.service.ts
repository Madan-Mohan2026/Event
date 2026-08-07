import { Event, IEvent } from '../models/event.model';

export async function updateEventFormSchema(eventId: string, formSchema: any[]): Promise<IEvent | null> {
  return await Event.findByIdAndUpdate(eventId, { formSchema }, { new: true });
}

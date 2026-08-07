import { Registration, IRegistration } from '../models/registration.model';

export async function markParticipantAttendance(registrationId: string): Promise<IRegistration | null> {
  return await Registration.findByIdAndUpdate(
    registrationId,
    {
      attended: true,
      attendedAt: new Date(),
      attendedDate: new Date().toLocaleDateString(),
      attendedTime: new Date().toLocaleTimeString()
    },
    { new: true }
  );
}

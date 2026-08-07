import { Registration, IRegistration } from '../models/registration.model';

export async function submitRegistrationFeedback(registrationId: string, feedbackText: string, rating?: number): Promise<IRegistration | null> {
  return await Registration.findByIdAndUpdate(
    registrationId,
    { feedback: feedbackText, rating },
    { new: true }
  );
}

import { Event } from '../models/event.model';
import { Registration } from '../models/registration.model';

export async function fetchDashboardCounts() {
  const [
    totalEvents,
    publishedEvents,
    draftEvents,
    totalRegistrations,
    spotRegistrations,
    attendanceCount,
    kitsIssued,
    couponsIssued
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ status: 'published' }),
    Event.countDocuments({ status: 'draft' }),
    Registration.countDocuments(),
    Registration.countDocuments({ category: 'Spot' }),
    Registration.countDocuments({ attended: true }),
    Registration.countDocuments({ kitIssued: true }),
    Registration.countDocuments({ $or: [{ foodRedeemed: true }, { couponIssued: true }] })
  ]);

  return {
    totalEvents,
    publishedEvents,
    draftEvents,
    totalRegistrations,
    spotRegistrations,
    attendanceCount,
    kitsIssued,
    couponsIssued
  };
}

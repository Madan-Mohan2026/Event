import { Response } from 'express';
import { Event } from '../models/event.model';
import { Registration } from '../models/registration.model';
import { AuditLog } from '../models/auditLog.model';
import { EventLog } from '../models/eventLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

let dashboardCache: { data: any; timestamp: number } | null = null;

export const clearDashboardCache = () => {
  dashboardCache = null;
};

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  if (dashboardCache && Date.now() - dashboardCache.timestamp < 10000) {
    console.log(`[PERF LOG] Server Cache Hit (1ms): GET /api/dashboard/stats`);
    res.status(200).json(dashboardCache.data);
    return;
  }

  console.log(`[PERF LOG] API Request Started: GET /api/dashboard/stats at ${new Date().toISOString()}`);

  try {
    console.log(`[PERF LOG] MongoDB Query Started: Dashboard aggregated counts`);
    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      totalRegistrations,
      spotRegistrations,
      attendanceCount,
      kitsIssued,
      couponsIssued,
      pendingKits,
      pendingFood,
      feedbackReceived,
      upcomingEvents,
      eventsList,
      regCountsAgg,
      categoryAgg,
      recentActivities,
      recentLogs
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'published' }),
      Event.countDocuments({ status: 'draft' }),
      Registration.countDocuments(),
      Registration.countDocuments({ category: 'Spot' }),
      Registration.countDocuments({ attended: true }),
      Registration.countDocuments({ kitIssued: true }),
      Registration.countDocuments({ $or: [{ foodRedeemed: true }, { couponIssued: true }] }),
      Registration.countDocuments({ attended: true, kitIssued: false }),
      Registration.countDocuments({ attended: true, $or: [{ foodRedeemed: false }, { couponIssued: false }] }),
      Registration.countDocuments({ feedback: { $ne: '' } }),
      Event.find().select('title date location category status capacity eventCode').sort({ date: 1 }).limit(5).lean(),
      Event.find().select('title capacity date').lean(),
      Registration.aggregate([{ $group: { _id: '$eventId', count: { $sum: 1 } } }]),
      Registration.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      EventLog.find().sort({ dateTime: -1, createdAt: -1 }).limit(15).populate('eventId', 'title').lean(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10).lean()
    ]);
    console.log(`[PERF LOG] MongoDB Query Finished: Dashboard aggregated counts in ${Date.now() - startTime}ms`);

    const foodRedeemed = couponsIssued;
    const countsMap = new Map<string, number>();
    regCountsAgg.forEach((item) => {
      if (item._id) countsMap.set(String(item._id), item.count);
    });

    const registrationsByEvent = eventsList.map((ev) => ({
      eventId: ev._id,
      title: ev.title,
      capacity: ev.capacity,
      date: ev.date,
      count: countsMap.get(String(ev._id)) || 0
    }));

    const participantCategories = categoryAgg.map(item => ({
      category: item._id || 'General',
      count: item.count
    }));

    const payload = {
      totalEvents,
      publishedEvents,
      draftEvents,
      totalRegistrations,
      spotRegistrations,
      attendanceCount,
      kitsIssued,
      couponsIssued,
      foodRedeemed,
      pendingKits,
      pendingFood,
      feedbackReceived,
      upcomingEvents,
      registrationsByEvent,
      participantCategories,
      recentActivities,
      recentLogs
    };

    dashboardCache = { data: payload, timestamp: Date.now() };

    console.log(`[PERF LOG] Response Sent: GET /api/dashboard/stats in ${Date.now() - startTime}ms`);
    res.status(200).json(payload);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve dashboard analytics.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Event-Specific Analytics — scoped to a single eventId
// Returns operational metrics filtered to the selected event only.
// ─────────────────────────────────────────────────────────────────────────────
export const getEventDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Resolve the event metadata
    const event = await Event.findById(eventId).select('title date location status capacity');
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const filter = { eventId };

    const [
      totalRegistrations,
      spotRegistrations,
      attendanceCount,
      kitsIssued,
      couponsIssued
    ] = await Promise.all([
      Registration.countDocuments(filter),
      Registration.countDocuments({ ...filter, category: 'Spot' }),
      Registration.countDocuments({ ...filter, attended: true }),
      Registration.countDocuments({ ...filter, kitIssued: true }),
      Registration.countDocuments({ ...filter, $or: [{ foodRedeemed: true }, { couponIssued: true }] })
    ]);

    res.status(200).json({
      eventId,
      eventTitle:   event.title,
      eventDate:    event.date,
      eventVenue:   event.location,
      eventStatus:  event.status,
      eventCapacity: event.capacity,
      totalRegistrations,
      spotRegistrations,
      attendanceCount,
      kitsIssued,
      couponsIssued
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve event analytics.' });
  }
};


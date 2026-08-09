import mongoose from 'mongoose';
import { Response } from 'express';
import { Event } from '../models/event.model';
import { Registration } from '../models/registration.model';
import { Form } from '../models/Form';
import { logAdminAction } from '../services/audit.service';
import { saveBase64ImageToDisk, saveBase64PdfToDisk } from '../services/bannerStorage.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { encryptToken, generateQrDataUrl, getAccessibleHostUrl } from '../utils/qr.utils';
import { clearDashboardCache } from './dashboard.controller';

// Helper to auto-generate checkin, kit desk, and food desk QR tokens and base64 PNG data URLs if missing or outdated
export async function ensureEventQrCode(event: any, baseUrl?: string): Promise<boolean> {
  let hostUrl = baseUrl || getAccessibleHostUrl();
  if (hostUrl.includes('localhost') || hostUrl.includes('127.0.0.1')) {
    hostUrl = getAccessibleHostUrl();
  }

  const checkinTargetUrl = `${hostUrl}/#attendance/${event._id}`;
  const kitTargetUrl = `${hostUrl}/#kit-checkin/${event._id}`;
  const foodTargetUrl = `${hostUrl}/#food-checkin/${event._id}`;

  let updated = false;

  if (!event.checkinQrToken) {
    event.checkinQrToken = encryptToken({
      type: 'EVENT_CHECKIN',
      eventId: String(event._id),
      eventCode: event.eventCode || 'EVT'
    });
    updated = true;
  }

  const hostOutdated = !event.checkinUrl || !event.checkinUrl.startsWith(hostUrl);

  if (hostOutdated || event.checkinUrl !== checkinTargetUrl) {
    event.checkinUrl = checkinTargetUrl;
    updated = true;
  }
  if (hostOutdated || event.kitDeskUrl !== kitTargetUrl) {
    event.kitDeskUrl = kitTargetUrl;
    updated = true;
  }
  if (hostOutdated || event.foodDeskUrl !== foodTargetUrl) {
    event.foodDeskUrl = foodTargetUrl;
    updated = true;
  }

  // Generate missing or host-outdated QR codes concurrently
  const needNewCheckinQr = !event.checkinQrCodeDataUrl || hostOutdated;
  const needNewKitQr = !event.kitQrCodeDataUrl || hostOutdated;
  const needNewFoodQr = !event.foodQrCodeDataUrl || hostOutdated;

  if (needNewCheckinQr || needNewKitQr || needNewFoodQr) {
    const [checkinQr, kitQr, foodQr] = await Promise.all([
      needNewCheckinQr ? generateQrDataUrl(checkinTargetUrl) : Promise.resolve(event.checkinQrCodeDataUrl),
      needNewKitQr ? generateQrDataUrl(kitTargetUrl) : Promise.resolve(event.kitQrCodeDataUrl),
      needNewFoodQr ? generateQrDataUrl(foodTargetUrl) : Promise.resolve(event.foodQrCodeDataUrl)
    ]);

    if (event.checkinQrCodeDataUrl !== checkinQr) { event.checkinQrCodeDataUrl = checkinQr; updated = true; }
    if (event.kitQrCodeDataUrl !== kitQr) { event.kitQrCodeDataUrl = kitQr; updated = true; }
    if (event.foodQrCodeDataUrl !== foodQr) { event.foodQrCodeDataUrl = foodQr; updated = true; }
  }

  if (updated) {
    if (typeof event.save === 'function') {
      await event.save();
    } else if (event._id) {
      await Event.updateOne(
        { _id: event._id },
        {
          $set: {
            checkinQrToken: event.checkinQrToken,
            checkinUrl: event.checkinUrl,
            kitDeskUrl: event.kitDeskUrl,
            foodDeskUrl: event.foodDeskUrl,
            checkinQrCodeDataUrl: event.checkinQrCodeDataUrl,
            kitQrCodeDataUrl: event.kitQrCodeDataUrl,
            foodQrCodeDataUrl: event.foodQrCodeDataUrl
          }
        }
      );
    }
  }
  return updated;
}

export const clearEventsCache = () => {
  // Cache disabled for instant updates
};

// Get all events with live metrics
export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const startTime = Date.now();

  console.log('⚡ [getEvents V2.0]: GET /api/events requested');

  try {
    const { status, view } = req.query;
    const filter: any = {};

    // If not logged in as admin, show only published events. Otherwise, allow filtering by status.
    if (!req.user) {
      filter.status = 'published';
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    const selectProjection = view === 'list'
      ? 'title eventCode date endDate time endTime location category participantType teamWide capacity assignedAdmin bannerImage status createdAt updatedAt'
      : '-checkinQrCodeDataUrl -kitQrCodeDataUrl -foodQrCodeDataUrl -formSchema -agenda';

    const [events, statsAgg] = await Promise.all([
      Event.find(filter)
        .select(selectProjection)
        .sort({ createdAt: -1 })
        .lean(),
      Registration.aggregate([
        {
          $group: {
            _id: '$eventId',
            regsCount: { $sum: 1 },
            foodCount: { $sum: { $cond: [{ $or: ['$foodRedeemed', '$couponIssued'] }, 1, 0] } },
            kitsCount: { $sum: { $cond: ['$kitIssued', 1, 0] } },
            scansCount: { $sum: { $cond: ['$attended', 1, 0] } }
          }
        }
      ])
    ]);

    const statsMap = new Map<string, any>();
    statsAgg.forEach(s => {
      if (s._id) statsMap.set(String(s._id), s);
    });

    const eventsWithStats = events.map((ev: any) => {
      const s = statsMap.get(String(ev._id)) || {};
      return {
        ...ev,
        regsCount: s.regsCount || 0,
        foodCount: s.foodCount !== undefined ? s.foodCount : (ev.foodCount || 0),
        kitsCount: s.kitsCount !== undefined ? s.kitsCount : (ev.kitsCount || 0),
        scansCount: s.scansCount !== undefined ? s.scansCount : (ev.scansCount || 0)
      };
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PERF LOG] GET /api/events completed in ${Date.now() - startTime}ms (${eventsWithStats.length} events returned)`);
    }

    res.status(200).json(eventsWithStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve events.' });
  }
};

// Get single event
export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    // Allow public access to event metadata for attendance checkin and registration desks
    if (!req.user && event.status === 'archived') {
      res.status(403).json({ error: 'This event has been archived.' });
      return;
    }

    await ensureEventQrCode(event);

    const evObj = event.toObject();
    const [regsCount, foodCount, kitsCount, scansCount] = await Promise.all([
      Registration.countDocuments({ eventId: event._id }),
      Registration.countDocuments({ eventId: event._id, couponIssued: true }),
      Registration.countDocuments({ eventId: event._id, kitIssued: true }),
      Registration.countDocuments({ eventId: event._id, attended: true })
    ]);

    res.status(200).json({
      ...evObj,
      regsCount,
      foodCount,
      kitsCount,
      scansCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve event.' });
  }
};

// Create new event
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('\n========================================');
  console.log('📌 [createEvent REQUEST ENTERED]');
  console.log('  req.user:', JSON.stringify(req.user || null));
  console.log('  req.body summary:', {
    title: req.body?.title,
    category: req.body?.category,
    participantType: req.body?.participantType,
    date: req.body?.date,
    endDate: req.body?.endDate,
    bannerImageLength: req.body?.bannerImage ? req.body.bannerImage.length : 0,
    agendaPdfLength: req.body?.agendaPdf ? req.body.agendaPdf.length : 0
  });

  try {
    const {
      title,
      description,
      category,
      participantType,
      teamWide,
      location,
      speakerDetails,
      date,
      endDate,
      time,
      endTime,
      capacity,
      registrationStart,
      registrationEnd,
      assignedAdmin,
      organizerName,
      contactNumber,
      supportEmail,
      bannerImage,
      agendaPdf,
      status,
      assignedFormId
    } = req.body;

    if (!title || !String(title).trim()) {
      console.warn('⚠️ [createEvent VALIDATION FAILED]: Missing Title');
      res.status(400).json({ error: 'Event Title is required.' });
      return;
    }

    // Safely parse dates or fallback to valid Defaults
    let startDateObj: Date;
    if (date) {
      const parsed = new Date(date);
      startDateObj = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      startDateObj = new Date();
    }

    let endDateObj: Date | undefined = undefined;
    if (endDate) {
      const parsed = new Date(endDate);
      if (!isNaN(parsed.getTime())) endDateObj = parsed;
    }
    if (!endDateObj) endDateObj = startDateObj;

    let regStartObj: Date | undefined = undefined;
    if (registrationStart) {
      const parsed = new Date(registrationStart);
      if (!isNaN(parsed.getTime())) regStartObj = parsed;
    }
    if (!regStartObj) regStartObj = startDateObj;

    const rawRegEnd = registrationEnd || req.body.registrationDeadline;
    let regEndObj: Date | undefined = undefined;
    if (rawRegEnd) {
      const parsed = new Date(rawRegEnd);
      if (!isNaN(parsed.getTime())) regEndObj = parsed;
    }
    if (!regEndObj) regEndObj = endDateObj;

    const totalEventsCount = (await Event.countDocuments()) + 1;
    const cleanSlug = String(title).toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
    const generatedEventCode = `EVT-${cleanSlug || 'EVENT'}-${100 + totalEventsCount}`;

    let sanitizedStatus: 'draft' | 'published' | 'archived' = 'published';
    if (status && ['draft', 'published', 'archived'].includes(String(status).toLowerCase())) {
      sanitizedStatus = String(status).toLowerCase() as any;
    }

    const newEvent = new Event({
      eventCode: generatedEventCode,
      title: String(title).trim(),
      description: description || '',
      category: category || 'General',
      participantType: participantType || 'Startups',
      teamWide: teamWide || 'Innotribes',
      organizerTeam: req.body.organizerTeam || organizerName || 'All Teams',
      eventType: req.body.eventType || 'All Event Types',
      location: location || '',
      speakerDetails: speakerDetails || '',
      date: startDateObj,
      endDate: endDateObj,
      time: time || '',
      endTime: endTime || '',
      capacity: capacity && Number(capacity) > 0 ? Number(capacity) : 500,
      registrationStart: regStartObj,
      registrationEnd: regEndObj,
      registrationStartTime: req.body.registrationStartTime || '',
      registrationEndTime: req.body.registrationEndTime || '',
      timezone: req.body.timezone || 'Asia/Calcutta',
      assignedAdmin: assignedAdmin || 'Unassigned (Super Admin Only)',
      organizerName: organizerName || req.body.organizerTeam || '',
      contactNumber: contactNumber || '',
      supportEmail: supportEmail || '',
      bannerImage: bannerImage ? saveBase64ImageToDisk(bannerImage, 'banner') : '',
      agendaPdf: agendaPdf ? saveBase64PdfToDisk(agendaPdf, 'agenda') : '',
      status: sanitizedStatus,
      assignedFormId: assignedFormId || '',
      formSchema: [
        { name: 'participantName', label: 'Full Name', fieldType: 'short_text', type: 'text', required: true, placeholder: 'Enter your full name' },
        { name: 'participantEmail', label: 'Email Address', fieldType: 'email', type: 'email', required: true, placeholder: 'name@example.com' },
        { name: 'participantPhone', label: 'Phone Number', fieldType: 'phone', type: 'text', required: false, placeholder: '+91 9876543210' }
      ],
      agenda: []
    });

    if (assignedFormId && String(assignedFormId).trim() !== '') {
      const assignedFormIdClean = String(assignedFormId).trim();
      const existingOtherEvent = await Event.findOne({
        assignedFormId: assignedFormIdClean
      });
      if (existingOtherEvent) {
        res.status(400).json({
          error: 'This form is already assigned to another event. Please select a different form.'
        });
        return;
      }
    }

    if (!newEvent.assignedFormId) {
      newEvent.assignedFormId = String(newEvent._id);
    }

    await newEvent.save();
    clearEventsCache();
    clearDashboardCache();
    console.log('✅ [createEvent SUCCESS]: Event and auto-linked form saved with _id:', newEvent._id);

    // Downstream Step 1: Audit Log (Caught separately to ensure main action succeeds)
    if (req.user) {
      try {
        await logAdminAction(
          req.user.id,
          req.user.username,
          'CREATE_EVENT',
          { eventId: newEvent._id, title: newEvent.title },
          req.ip || 'unknown'
        );
        console.log('✅ [createEvent DOWNSTREAM AUDIT LOG]: Audit log saved successfully.');
      } catch (auditErr: any) {
        console.error('⚠️ [createEvent DOWNSTREAM AUDIT LOG ERROR]:', auditErr.stack || auditErr.message);
      }
    }

    console.log('========================================\n');
    res.status(201).json(newEvent);
  } catch (error: any) {
    console.error('❌ [createEvent STACK TRACE]:');
    console.error(error.stack || error);
    console.log('========================================\n');
    res.status(500).json({
      error: error.message || 'Failed to create event.',
      details: error.name || 'CreateEventError',
      stack: error.stack
    });
  }
};

// Update event
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      participantType,
      teamWide,
      location,
      speakerDetails,
      date,
      endDate,
      time,
      endTime,
      capacity,
      registrationStart,
      registrationEnd,
      assignedAdmin,
      organizerName,
      contactNumber,
      supportEmail,
      bannerImage,
      agendaPdf,
      status,
      assignedFormId
    } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    if (title !== undefined) event.title = String(title).trim();
    if (description !== undefined) event.description = description;
    if (category !== undefined) event.category = category;
    if (participantType !== undefined) event.participantType = participantType;
    if (teamWide !== undefined) event.teamWide = teamWide;
    if (location !== undefined) event.location = location;
    if (speakerDetails !== undefined) event.speakerDetails = speakerDetails;
    if (date !== undefined && date !== null && date !== '') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) event.date = parsed;
    }
    if (endDate !== undefined && endDate !== null && endDate !== '') {
      const parsed = new Date(endDate);
      if (!isNaN(parsed.getTime())) event.endDate = parsed;
    }
    if (time !== undefined) event.time = time;
    if (endTime !== undefined) event.endTime = endTime;
    if (capacity !== undefined) event.capacity = Number(capacity);
    if (registrationStart !== undefined && registrationStart !== null && registrationStart !== '') {
      const parsed = new Date(registrationStart);
      if (!isNaN(parsed.getTime())) event.registrationStart = parsed;
    }
    const targetRegEnd = registrationEnd !== undefined ? registrationEnd : req.body.registrationDeadline;
    if (targetRegEnd !== undefined && targetRegEnd !== null && targetRegEnd !== '') {
      const parsed = new Date(targetRegEnd);
      if (!isNaN(parsed.getTime())) event.registrationEnd = parsed;
    }
    if (req.body.registrationStartTime !== undefined) event.registrationStartTime = req.body.registrationStartTime;
    if (req.body.registrationEndTime !== undefined) event.registrationEndTime = req.body.registrationEndTime;
    if (req.body.timezone !== undefined) event.timezone = req.body.timezone;
    if (assignedAdmin !== undefined) event.assignedAdmin = assignedAdmin;
    if (req.body.organizerTeam !== undefined) {
      event.organizerTeam = req.body.organizerTeam;
      if (!event.organizerName) event.organizerName = req.body.organizerTeam;
    }
    if (req.body.eventType !== undefined) event.eventType = req.body.eventType;
    if (organizerName !== undefined) {
      event.organizerName = organizerName;
      if (!event.organizerTeam) event.organizerTeam = organizerName;
    }
    if (contactNumber !== undefined) event.contactNumber = contactNumber;
    if (supportEmail !== undefined) event.supportEmail = supportEmail;
    if (bannerImage !== undefined) event.bannerImage = bannerImage ? saveBase64ImageToDisk(bannerImage, 'banner') : '';
    if (agendaPdf !== undefined && agendaPdf !== '') event.agendaPdf = saveBase64PdfToDisk(agendaPdf, 'agenda');
    if (status !== undefined) {
      const s = String(status).toLowerCase();
      if (['draft', 'published', 'archived'].includes(s)) {
        event.status = s as any;
      }
    }
    if (assignedFormId !== undefined) {
      const assignedFormIdClean = String(assignedFormId || '').trim();
      if (assignedFormIdClean !== '') {
        const existingOtherEvent = await Event.findOne({
          assignedFormId: assignedFormIdClean,
          _id: { $ne: event._id }
        });
        if (existingOtherEvent) {
          res.status(400).json({
            error: 'This form is already assigned to another event. Please select a different form.'
          });
          return;
        }
      }
      event.assignedFormId = assignedFormIdClean;
    }

    await event.save();
    clearEventsCache();
    clearDashboardCache();

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'UPDATE_EVENT',
        { eventId: event._id, title: event.title, updatedFields: Object.keys(req.body) },
        req.ip || 'unknown'
      ).catch(() => {});
    }

    res.status(200).json(event);
  } catch (error: any) {
    console.error('[updateEvent ERROR]:', error);
    res.status(500).json({ error: error.message || 'Failed to update event.' });
  }
};

// Delete event
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let event = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await Event.findById(id);
    }
    if (!event) {
      event = await Event.findOne({ _id: id });
    }

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    await Event.deleteOne({ _id: event._id });

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'DELETE_EVENT',
        { eventId: String(event._id), title: event.title },
        req.ip || 'unknown'
      ).catch(() => {});
    }

    clearEventsCache();
    clearDashboardCache();

    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete event.' });
  }
};

// Update Form Schema (Form Studio)
export const updateFormSchema = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { formSchema } = req.body;

    if (!Array.isArray(formSchema)) {
      res.status(400).json({ error: 'Form schema must be an array of fields.' });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    event.formSchema = formSchema;
    await event.save();

    try {
      await Form.findByIdAndUpdate(
        event._id,
        {
          title: event.title,
          description: event.description || '',
          eventId: String(event._id),
          formSchema,
          fields: formSchema
        },
        { upsert: true }
      );
    } catch (e) {}

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'UPDATE_FORM_SCHEMA',
        { eventId: event._id, title: event.title, fieldsCount: formSchema.length },
        req.ip || 'unknown'
      );
    }

    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update form schema.' });
  }
};

// Update Agenda
export const updateAgenda = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { agenda } = req.body;

    if (!Array.isArray(agenda)) {
      res.status(400).json({ error: 'Agenda must be an array of sessions.' });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    event.agenda = agenda;
    await event.save();

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'UPDATE_AGENDA',
        { eventId: event._id, title: event.title, sessionsCount: agenda.length },
        req.ip || 'unknown'
      );
    }

    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update agenda.' });
  }
};

// Regenerate Event Check-in QR Code
export const regenerateEventQr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const host = req.get('origin') || req.get('referer') || 'http://localhost:5173';
    const baseUrl = host.endsWith('/') ? host.slice(0, -1) : host;
    const targetUrl = `${baseUrl}/#event/${event._id}/checkin`;

    event.checkinQrToken = encryptToken({
      type: 'EVENT_CHECKIN',
      eventId: String(event._id),
      eventCode: event.eventCode,
      regeneratedAt: Date.now()
    });
    event.checkinUrl = targetUrl;
    event.checkinQrCodeDataUrl = await generateQrDataUrl(targetUrl);

    await event.save();

    res.status(200).json({
      success: true,
      checkinQrToken: event.checkinQrToken,
      checkinUrl: event.checkinUrl,
      checkinQrCodeDataUrl: event.checkinQrCodeDataUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to regenerate event QR code.' });
  }
};

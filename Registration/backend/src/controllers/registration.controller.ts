import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/event.model';
import { Registration } from '../models/registration.model';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAdminAction } from '../services/audit.service';
import { generateQrDataUrl, decryptToken, getAccessibleHostUrl } from '../utils/qr.utils';
import { broadcastRealtimeEvent } from '../services/realtime.service';
import { recordEventAction } from '../services/eventLog.service';
import { clearDashboardCache } from './dashboard.controller';
import { clearEventsCache } from './event.controller';

// Helper to validate ObjectId strings
const isValidObjectId = (id: any): boolean => {
  if (!id || id === 'null' || id === 'undefined') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Helper to robustly extract participantName, participantEmail, and participantPhone from formData.
 */
export function extractParticipantDetailsFromFormData(formData: Record<string, any>) {
  const data = formData instanceof Map ? Object.fromEntries(formData) : (formData || {});

  let name = '';
  let email = '';
  let phone = '';

  // 1. Direct key check first
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null || val === '') continue;
    const strVal = String(val).trim();
    const normKey = key.toLowerCase().replace(/[^a-z]/g, '');

    // Name match
    if (!name && (normKey === 'participantname' || normKey === 'fullname' || normKey === 'name' || normKey === 'applicantname' || normKey.includes('name'))) {
      if (strVal && !strVal.includes('@') && !/^\d+$/.test(strVal)) {
        name = strVal;
      }
    }

    // Email match
    if (!email && (normKey === 'participantemail' || normKey === 'email' || normKey === 'emailaddress' || normKey.includes('email') || strVal.includes('@'))) {
      if (strVal.includes('@') && strVal.includes('.')) {
        email = strVal;
      }
    }

    // Phone match
    if (!phone && (normKey === 'participantphone' || normKey === 'phone' || normKey === 'mobile' || normKey === 'mobilenumber' || normKey.includes('phone') || normKey.includes('mobile') || normKey.includes('contact'))) {
      const cleanDigits = strVal.replace(/\D/g, '');
      if (cleanDigits.length >= 7) {
        phone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      }
    }
  }

  // 2. Fallback Phone Extraction
  if (!phone) {
    for (const [_, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      const cleanDigits = String(val).trim().replace(/\D/g, '');
      if (cleanDigits.length >= 10 && cleanDigits.length <= 13) {
        phone = cleanDigits.slice(-10);
        break;
      }
    }
  }

  // 3. Fallback Email Extraction
  if (!email) {
    for (const [_, val] of Object.entries(data)) {
      if (!val) continue;
      const strVal = String(val).trim();
      if (strVal.includes('@') && strVal.includes('.')) {
        email = strVal;
        break;
      }
    }
  }

  // 4. Fallback Name Extraction
  if (!name) {
    for (const [_, val] of Object.entries(data)) {
      if (!val) continue;
      const strVal = String(val).trim();
      if (strVal && !strVal.includes('@') && !/^\d+$/.test(strVal) && strVal.length > 1) {
        name = strVal;
        break;
      }
    }
  }

  return {
    participantName: String(name || 'Participant').trim(),
    participantEmail: String(email || '').trim().toLowerCase(),
    participantPhone: String(phone || '').trim()
  };
}

/**
 * Helper to generate structured Registration ID: REG-{CLEAN_CODE}-{4_DIGIT_ID}
 * First digit of 4-digit number = Event Order (1, 2, 3...)
 * Last digits = Registration sequence for that event starting from 1
 * e.g., Event #2 (spark), Participant 1 => REG-SPARK-2001
 * e.g., Event #2 (spark), Participant 2 => REG-SPARK-2002
 */
export async function generateStructuredRegistrationId(eventId: string, eventTitle?: string): Promise<string> {
  const allEventsSorted = await Event.find({}).sort({ createdAt: 1 }).select('_id');
  const foundIndex = allEventsSorted.findIndex(e => String(e._id) === String(eventId));
  const eventOrder = foundIndex >= 0 ? (foundIndex + 1) : 1;

  const countForEvent = await Registration.countDocuments({ eventId });
  const participantNum = countForEvent + 1;
  const numericId = (eventOrder * 1000) + participantNum;

  const cleanCode = String(eventTitle || 'EVENT')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8) || 'EVENT';

  let regId = `REG-${cleanCode}-${numericId}`;
  let counter = numericId;

  while (await Registration.findOne({ registrationId: regId })) {
    counter++;
    regId = `REG-${cleanCode}-${counter}`;
  }

  return regId;
}


// Register for an event (Public endpoint)
export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const { formData } = req.body;

    if (!formData) {
      res.status(400).json({ error: 'Form data is required.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    // Check status
    if (event.status !== 'published') {
      res.status(400).json({ error: 'Registrations are not open for this event (event is not published).' });
      return;
    }

    // Check dates
    const now = new Date();
    if (event.registrationStart && now < new Date(event.registrationStart)) {
      res.status(400).json({ error: 'Registrations have not started yet.' });
      return;
    }
    if (event.registrationEnd) {
      const regEnd = new Date(event.registrationEnd);
      regEnd.setHours(23, 59, 59, 999);
      if (now > regEnd) {
        res.status(400).json({ error: 'Registrations have closed.' });
        return;
      }
    }

    // Check capacity (only enforce if capacity is set and > 0)
    const registrationCount = await Registration.countDocuments({ eventId });
    if (event.capacity && Number(event.capacity) > 0 && registrationCount >= Number(event.capacity)) {
      res.status(400).json({ error: 'Event has reached maximum capacity.' });
      return;
    }

    // Validate form schema
    const validationErrors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const field of event.formSchema) {
      const value = formData[field.name] !== undefined && formData[field.name] !== null && formData[field.name] !== '' 
        ? formData[field.name] 
        : (formData[field.label] !== undefined && formData[field.label] !== null && formData[field.label] !== '' ? formData[field.label] : '');

      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        validationErrors.push(`Field "${field.label || field.name}" is required.`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        const fieldType = (field.type || (field as any).fieldType || '').toLowerCase();
        // Type specific checks
        if (fieldType === 'email' || field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            validationErrors.push(`Field "${field.label || field.name}" must be a valid email address.`);
          }
        } else if (fieldType === 'number' || field.type === 'number') {
          if (isNaN(Number(value))) {
            validationErrors.push(`Field "${field.label || field.name}" must be a number.`);
          }
        }
        if (field.name) sanitizedData[field.name] = value;
        if (field.label) sanitizedData[field.label] = value;
      } else {
        if (field.name) sanitizedData[field.name] = '';
        if (field.label) sanitizedData[field.label] = '';
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({ error: 'Validation failed.', details: validationErrors });
      return;
    }

    // Duplicate email registration safeguard
    const emailField = event.formSchema.find(f => f.type === 'email');
    if (emailField) {
      const emailValue = sanitizedData[emailField.name] || sanitizedData[emailField.label];
      if (emailValue) {
        const query: any = { eventId };
        query[`formData.${emailField.name}`] = emailValue;

        const existingReg = await Registration.findOne(query);
        if (existingReg) {
          res.status(400).json({ error: 'You have already registered for this event with this email address.' });
          return;
        }
      }
    }

    // Extract human-readable values for top-level MongoDB document fields
    const extractedDetails = extractParticipantDetailsFromFormData(sanitizedData);
    const pName = extractedDetails.participantName;
    const pEmail = extractedDetails.participantEmail;
    const pPhone = extractedDetails.participantPhone;

    // Generate unique Registration Reference ID using structured (EventOrder * 1000 + ParticipantNum)
    const regId = await generateStructuredRegistrationId(eventId, event.title);

    // Build submittedFields array for dynamic field tracking
    const submittedFieldsArr = (event.formSchema || []).map((field: any) => {
      const val = sanitizedData[field.name] !== undefined ? sanitizedData[field.name] : (sanitizedData[field.label] || '');
      return {
        fieldId: field.name || field.id || `field_${Date.now()}`,
        label: field.label || field.name || 'Question',
        type: field.fieldType || field.type || 'text',
        value: val
      };
    });

    const registration = new Registration({
      registrationId: regId,
      eventId,
      eventTitle: event.title || 'Event',
      formId: event.assignedFormId || String(event._id),
      participantName: pName,
      participantEmail: pEmail,
      participantPhone: pPhone,
      participant: {
        fullName: pName,
        email: pEmail,
        phone: pPhone
      },
      formData: sanitizedData,
      submittedFields: submittedFieldsArr,
      status: 'Registered',
      registeredAt: new Date()
    });

    try {
      await registration.save();
      console.log(`[registration]: Saved registration ${registration._id} to collection 'registrations' for event ${eventId}`);
    } catch (saveError: any) {
      console.error(`[registration]: FAILED to save registration for event ${eventId}:`, saveError.message);
      res.status(500).json({ error: 'Failed to save registration to database. Please try again.' });
      return;
    }

    // Increment regsCount on Event document in MongoDB (non-blocking)
    Event.findByIdAndUpdate(eventId, { $inc: { regsCount: 1 } })
      .catch((err) => console.warn('[registration]: Could not increment regsCount on event:', err.message));

    // Realtime broadcast and cache invalidation for live sync
    clearDashboardCache();
    clearEventsCache();
    broadcastRealtimeEvent('STATS_UPDATED', { action: 'NEW_REGISTRATION', eventId, registrationId: registration._id });

    res.status(201).json({ message: 'Registration submitted successfully!', registration });
  } catch (error: any) {
    console.error('[registration]: Unhandled error in registerForEvent:', error.message);
    res.status(500).json({ error: error.message || 'Failed to submit registration.' });
  }
};

// Get all registrations across events (Admin only)
export const getAllRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, category, attendance, view, search, page, limit } = req.query;
    const filter: any = {};

    const isSuperAdmin = !req.user || req.user.role === 'super_admin' || (req.user.role as any) === 'superadmin';
    if (!isSuperAdmin && req.user) {
      const userDoc = await User.findById(req.user.id).lean();
      const assignedIds = userDoc?.assignedEventIds?.map(id => String(id)) || (userDoc?.assignedEventId ? [String(userDoc.assignedEventId)] : []);
      if (eventId && eventId !== 'all' && isValidObjectId(eventId)) {
        filter.eventId = assignedIds.includes(String(eventId)) ? eventId : { $in: [] };
      } else {
        filter.eventId = { $in: assignedIds };
      }
    } else {
      if (eventId && eventId !== 'all' && isValidObjectId(eventId)) {
        filter.eventId = eventId;
      }
    }

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (attendance && attendance !== 'all') {
      if (attendance === 'present') filter.attended = true;
      if (attendance === 'absent') filter.attended = false;
    }

    if (search && String(search).trim()) {
      const s = String(search).trim();
      const searchRegex = new RegExp(s, 'i');
      filter.$or = [
        { participantName: searchRegex },
        { participantEmail: searchRegex },
        { participantPhone: searchRegex },
        { registrationId: searchRegex }
      ];
    }

    const isListView = view === 'list';
    let query = Registration.find(filter);

    if (isListView) {
      query = query.select(
        '_id registrationId participantName participantEmail participantPhone eventId eventTitle attended kitIssued foodRedeemed couponIssued status registeredAt category spotRegistration'
      );
    } else {
      query = query.select('-kitQrCodeDataUrl -foodQrCodeDataUrl');
    }

    query = query.populate({ path: 'eventId', select: 'title category capacity' }).sort({ registeredAt: -1, createdAt: -1 });

    const pageNum = Number(page);
    const limitNum = Number(limit) || 20;

    if (pageNum && pageNum > 0) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [registrations, totalRegistrations] = await Promise.all([
      query.lean(),
      Registration.countDocuments(filter)
    ]);

    res.status(200).json({
      totalRegistrations,
      page: pageNum || 1,
      limit: limitNum,
      totalPages: Math.ceil(totalRegistrations / limitNum),
      registrations
    });
  } catch (error: any) {
    console.error('[registration]: Error in getAllRegistrations:', error.message);
    res.status(500).json({ error: error.message || 'Failed to retrieve all registrations.' });
  }
};

// Get registrations for an event (Admin only)
export const getRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { view, page, limit, search } = req.query;

    if (!eventId || eventId === 'all' || eventId === 'null' || eventId === 'undefined' || !isValidObjectId(eventId)) {
      return getAllRegistrations(req, res);
    }

    const isSuperAdmin = !req.user || req.user.role === 'super_admin' || (req.user.role as any) === 'superadmin';
    if (!isSuperAdmin && req.user) {
      const userDoc = await User.findById(req.user.id).lean();
      const assignedIds = userDoc?.assignedEventIds?.map(id => String(id)) || (userDoc?.assignedEventId ? [String(userDoc.assignedEventId)] : []);
      if (!assignedIds.includes(String(eventId))) {
        res.status(403).json({ error: 'Access Denied: You are not authorized to view registrations for this event.' });
        return;
      }
    }

    const filter: any = { eventId };
    if (search && String(search).trim()) {
      const s = String(search).trim();
      const searchRegex = new RegExp(s, 'i');
      filter.$or = [
        { participantName: searchRegex },
        { participantEmail: searchRegex },
        { participantPhone: searchRegex },
        { registrationId: searchRegex }
      ];
    }

    const isListView = view === 'list';
    let query = Registration.find(filter);

    if (isListView) {
      query = query.select(
        '_id registrationId participantName participantEmail participantPhone eventId eventTitle attended kitIssued foodRedeemed couponIssued status registeredAt category spotRegistration'
      );
    } else {
      query = query.select('-kitQrCodeDataUrl -foodQrCodeDataUrl');
    }

    query = query.sort({ registeredAt: -1 });

    const pageNum = Number(page);
    const limitNum = Number(limit) || 20;

    if (pageNum && pageNum > 0) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [event, registrations] = await Promise.all([
      Event.findById(eventId).select('-checkinQrCodeDataUrl -kitQrCodeDataUrl -foodQrCodeDataUrl -formSchema -agenda').lean(),
      query.lean()
    ]);

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    res.status(200).json({ event, registrations });
  } catch (error: any) {
    console.error('[registration]: Error in getRegistrations:', error.message);
    res.status(500).json({ error: error.message || 'Failed to retrieve registrations.' });
  }
};

// Export registrations to CSV (Admin only)
export const exportRegistrationsCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const isSuperAdmin = !req.user || req.user.role === 'super_admin' || (req.user.role as any) === 'superadmin';
    if (!isSuperAdmin && req.user) {
      const userDoc = await User.findById(req.user.id).lean();
      const assignedIds = userDoc?.assignedEventIds?.map(id => String(id)) || (userDoc?.assignedEventId ? [String(userDoc.assignedEventId)] : []);
      if (!assignedIds.includes(String(eventId))) {
        res.status(403).json({ error: 'Access Denied: You are not authorized to export data for this event.' });
        return;
      }
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const registrations = await Registration.find({ eventId }).sort({ registeredAt: 1 });

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="registrations_${eventId}.csv"`);

    // Build header row
    const headers = ['Registered At', ...event.formSchema.map(field => field.label)];

    // Function to format CSV cell value
    const escapeCSV = (val: any): string => {
      if (val === undefined || val === null) return '""';
      let str = String(val);
      // Double up any quotes
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    res.write(headers.map(escapeCSV).join(',') + '\n');

    // Build rows
    for (const reg of registrations) {
      const row = [
        reg.registeredAt.toISOString(),
        ...event.formSchema.map(field => {
          const rawVal = reg.formData.get(field.name);
          return rawVal !== undefined ? rawVal : '';
        })
      ];
      res.write(row.map(escapeCSV).join(',') + '\n');
    }

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'EXPORT_REGISTRATIONS',
        { eventId, title: event.title, count: registrations.length },
        req.ip || 'unknown'
      );
    }

    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export CSV.' });
  }
};

export const updateRegistrationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { attended, kitIssued, couponIssued, feedback, category } = req.body;

    const registration = await Registration.findById(id);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found.' });
      return;
    }

    if (attended !== undefined) {
      registration.attended = attended;
      if (attended) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        registration.attendedAt = registration.attendedAt || now;
        registration.attendedDate = registration.attendedDate || formattedDate;
        registration.attendedTime = registration.attendedTime || formattedTime;
        if (!registration.kitIssued) {
          registration.kitIssued = true;
          registration.kitIssuedAt = now;
          registration.kitIssuedDate = formattedDate;
          registration.kitIssuedTime = formattedTime;
          registration.kitQrExpired = true;
        }
      }
    }
    if (kitIssued !== undefined) registration.kitIssued = kitIssued;
    if (couponIssued !== undefined) registration.couponIssued = couponIssued;
    if (feedback !== undefined) registration.feedback = feedback;
    if (category !== undefined) registration.category = category;

    await registration.save();

    // Recalculate event counters
    if (registration.eventId) {
      const scansCount = await Registration.countDocuments({ eventId: registration.eventId, attended: true });
      const kitsCount = await Registration.countDocuments({ eventId: registration.eventId, kitIssued: true });
      await Event.findByIdAndUpdate(registration.eventId, { scansCount, kitsCount }).catch(() => null);
    }

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'UPDATE_REGISTRATION_STATUS',
        { registrationId: id, changes: req.body },
        req.ip || 'unknown'
      );
    }

    res.status(200).json({ message: 'Status updated successfully.', registration });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update status.' });
  }
};

// POST /api/registrations/dispatch-feedback/:eventId — Dispatch feedback form to all registered applicants
export const dispatchFeedbackForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const registrations = await Registration.find({ eventId });
    await Registration.updateMany({ eventId }, { $set: { feedbackSent: true } });

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'DISPATCH_FEEDBACK_FORM',
        { eventId, title: event.title, recipientCount: registrations.length },
        req.ip || 'unknown'
      );
    }

    res.status(200).json({
      message: `Feedback form assigned & dispatched to all ${registrations.length} registered participants for "${event.title}".`,
      eventTitle: event.title,
      recipientCount: registrations.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to dispatch feedback form.' });
  }
};

// POST /api/registrations/public-feedback/:eventId — Public feedback submission by event attendee
export const submitPublicFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { email, registrationId, rating, feedback } = req.body;

    if (!feedback || feedback.trim() === '') {
      res.status(400).json({ error: 'Feedback comment is required.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    let registration;
    if (registrationId) {
      registration = await Registration.findById(registrationId);
    } else if (email) {
      const regs = await Registration.find({ eventId });
      registration = regs.find(r => {
        const formDataObj = r.formData instanceof Map ? Object.fromEntries(r.formData) : (r.formData || {});
        return formDataObj.email && formDataObj.email.toLowerCase() === email.toLowerCase();
      });
    }

    if (!registration) {
      registration = new Registration({
        eventId,
        formData: { name: email ? email.split('@')[0] : 'Event Participant', email: email || 'participant@event.com' },
        attended: true,
        feedback: feedback.trim(),
        rating: Number(rating) || 5
      });
    } else {
      registration.feedback = feedback.trim();
      registration.rating = Number(rating) || 5;
    }

    await registration.save();

    res.status(200).json({ message: 'Thank you! Your feedback has been submitted successfully.', registration });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit feedback.' });
  }
};

/**
 * Public endpoint: Verify whether a participant exists for an event using their registered mobile number.
 * Used when participants scan the event QR code at the venue entrance.
 */
export const verifyParticipantMobile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const rawMobile = req.body.mobile || req.body.mobileNumber || req.body.phone;
    const mobile = typeof rawMobile === 'string' ? rawMobile : (rawMobile ? String(rawMobile) : '');

    if (!mobile || !mobile.trim()) {
      recordEventAction({
        eventId: eventId || '',
        registeredMobileNumber: mobile || '',
        actionType: 'Mobile Verification',
        actionStatus: 'Invalid Mobile',
        details: 'Mobile number was not provided or empty.'
      });
      res.status(400).json({ error: 'Registered mobile number is required.' });
      return;
    }

    const cleanInputMobile = mobile.replace(/\D/g, '');
    if (cleanInputMobile.length < 5) {
      recordEventAction({
        eventId: eventId || '',
        registeredMobileNumber: mobile,
        actionType: 'Mobile Verification',
        actionStatus: 'Invalid Mobile',
        details: `Entered mobile number is less than 5 digits: "${mobile}"`
      });
      res.status(400).json({ error: 'Please enter a valid mobile number.' });
      return;
    }

    const last10 = cleanInputMobile.length >= 10 ? cleanInputMobile.slice(-10) : cleanInputMobile;

    const phoneVariants = Array.from(new Set([
      mobile.trim(),
      cleanInputMobile,
      last10,
      `+91${last10}`,
      `91${last10}`,
      `0${last10}`
    ])).filter(Boolean);

    const regIdVariants = Array.from(new Set([
      mobile.trim(),
      mobile.trim().toUpperCase(),
      mobile.trim().toLowerCase()
    ])).filter(Boolean);

    const eventFilter = (eventId && eventId !== 'all' && eventId.length === 24) ? { eventId } : {};

    // 1. Ultra-fast B-Tree indexed search (Primary)
    const [foundReg, eventDoc] = await Promise.all([
      Registration.findOne({
        ...eventFilter,
        $or: [
          { participantPhone: { $in: phoneVariants } },
          { registrationId: { $in: regIdVariants } },
          ...(/^[0-9a-fA-F]{24}$/.test(mobile.trim()) ? [{ _id: mobile.trim() }] : [])
        ]
      }),
      (eventId && eventId.length === 24) ? Event.findById(eventId).select('title').lean().catch(() => null) : Promise.resolve(null)
    ]);

    let matchedRegistration = foundReg;

    // 2. Fast indexed search in formData keys if root participantPhone was blank
    if (!matchedRegistration) {
      matchedRegistration = await Registration.findOne({
        ...eventFilter,
        $or: [
          { 'formData.mobile': { $in: phoneVariants } },
          { 'formData.phone': { $in: phoneVariants } },
          { 'formData.Mobile Number': { $in: phoneVariants } },
          { 'formData.Phone Number': { $in: phoneVariants } },
          { 'formData.Phone': { $in: phoneVariants } },
          { 'formData.Mobile': { $in: phoneVariants } },
          { 'formData.contact': { $in: phoneVariants } }
        ]
      });
    }

    if (!matchedRegistration) {
      recordEventAction({
        eventId,
        registeredMobileNumber: mobile.trim(),
        actionType: 'Mobile Verification',
        actionStatus: 'Registration Not Found',
        details: `No participant registration found for mobile number ${mobile.trim()}`
      }).catch(() => {});
      res.status(404).json({
        exists: false,
        error: 'No registration found with this mobile number for this event.'
      });
      return;
    }

    // Extract participant details
    const extractedDetails = extractParticipantDetailsFromFormData(matchedRegistration.formData);
    if (!matchedRegistration.participantPhone && extractedDetails.participantPhone) {
      matchedRegistration.participantPhone = extractedDetails.participantPhone;
    }
    if ((!matchedRegistration.participantName || matchedRegistration.participantName === 'Participant') && extractedDetails.participantName) {
      matchedRegistration.participantName = extractedDetails.participantName;
    }
    if (!matchedRegistration.participantEmail && extractedDetails.participantEmail) {
      matchedRegistration.participantEmail = extractedDetails.participantEmail;
    }

    const regData = matchedRegistration.formData instanceof Map 
      ? Object.fromEntries(matchedRegistration.formData) 
      : (matchedRegistration.formData || {});

    const participantName = matchedRegistration.participantName || extractedDetails.participantName || 'Participant';
    const photo = regData.photo || regData.profilePhoto || regData.picture || regData.avatar || '';
    const organization = regData.organization || regData.org || regData.company || regData['Organization'] || regData.college || 'N/A';
    const designation = regData.designation || regData.role || regData.jobTitle || regData['Designation'] || 'N/A';
    const shortRegId = matchedRegistration.registrationId || `#REG-${String(matchedRegistration._id).substring(18).toUpperCase()}`;
    const deskType = req.body.deskType || req.body.type || 'attendance';

    let alreadyAttended = matchedRegistration.attended;
    const now = new Date();
    let updated = false;

    const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    // Mark Entrance Attendance & Issue Kit for Event Check-in
    if (deskType === 'attendance' || deskType === 'checkin') {
      let isFirstAttendance = !matchedRegistration.attended;

      if (isFirstAttendance) {
        matchedRegistration.attended = true;
        matchedRegistration.attendedAt = now;
        matchedRegistration.attendedDate = formattedDate;
        matchedRegistration.attendedTime = formattedTime;
        matchedRegistration.attendedBy = 'Participant Verification Portal';
        updated = true;

        Event.findByIdAndUpdate(matchedRegistration.eventId || eventId, { $inc: { scansCount: 1 } }).catch(() => null);
      }

      if (!matchedRegistration.kitIssued) {
        matchedRegistration.kitIssued = true;
        matchedRegistration.kitIssuedAt = now;
        matchedRegistration.kitIssuedDate = formattedDate;
        matchedRegistration.kitIssuedTime = formattedTime;
        matchedRegistration.kitIssuedBy = 'Entrance Check-in Desk';
        matchedRegistration.kitQrExpired = true;
        updated = true;

        Event.findByIdAndUpdate(matchedRegistration.eventId || eventId, { $inc: { kitsCount: 1 } }).catch(() => null);
      }
    }

    if (deskType === 'food') {
      if (!matchedRegistration.attended) {
        recordEventAction({
          eventId: matchedRegistration.eventId || eventId,
          registeredMobileNumber: mobile.trim(),
          actionType: 'Food Redeemed',
          actionStatus: 'Failed',
          details: 'Food redemption blocked: Attendance not verified yet.'
        });
        res.status(400).json({
          success: false,
          requiresAttendance: true,
          error: 'Attendance Not Recorded! Please complete your Event Entrance Check-in first before redeeming your food coupon.'
        });
        return;
      }
      if (!matchedRegistration.foodRedeemed) {
        matchedRegistration.foodRedeemed = true;
        matchedRegistration.couponIssued = true;
        matchedRegistration.foodRedeemedAt = now;
        matchedRegistration.foodRedeemedDate = formattedDate;
        matchedRegistration.foodRedeemedTime = formattedTime;
        matchedRegistration.foodRedeemedBy = 'Mobile Food Counter Desk';
        updated = true;
      }
    }

    // Ensure Kit & Food QR Codes exist (generated ONLY if missing)
    const hostUrl = getAccessibleHostUrl(req);
    const targetEvtId = String(matchedRegistration.eventId || eventId || '');

    const needsKitQr = !matchedRegistration.kitQrToken || !matchedRegistration.kitQrCodeDataUrl;
    const needsFoodQr = !matchedRegistration.foodQrToken || !matchedRegistration.foodQrCodeDataUrl;

    if (needsKitQr || needsFoodQr) {
      const kitWebUrl = `${hostUrl}/#kit-checkin/${targetEvtId}`;
      const foodWebUrl = `${hostUrl}/#food-checkin/${targetEvtId}`;

      const [kitDataUrl, foodDataUrl] = await Promise.all([
        needsKitQr ? generateQrDataUrl(kitWebUrl) : Promise.resolve(matchedRegistration.kitQrCodeDataUrl),
        needsFoodQr ? generateQrDataUrl(foodWebUrl) : Promise.resolve(matchedRegistration.foodQrCodeDataUrl)
      ]);

      if (needsKitQr) {
        matchedRegistration.kitQrToken = String(matchedRegistration._id);
        matchedRegistration.kitQrCodeDataUrl = kitDataUrl;
        matchedRegistration.kitQrCreatedAt = now;
        updated = true;
      }
      if (needsFoodQr) {
        matchedRegistration.foodQrToken = String(matchedRegistration._id);
        matchedRegistration.foodQrCodeDataUrl = foodDataUrl;
        matchedRegistration.foodQrCreatedAt = now;
        updated = true;
      }
    }

    // Single consolidated database save
    if (updated) {
      await matchedRegistration.save();
    }

    // Non-blocking background event log & SSE broadcast
    broadcastRealtimeEvent('STATS_UPDATED', {
      action: deskType.toUpperCase(),
      eventId: matchedRegistration.eventId || eventId,
      registrationId: matchedRegistration._id,
      participantName
    });

    recordEventAction({
      eventId: matchedRegistration.eventId || eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: mobile.trim(),
      actionType: deskType === 'kit' ? 'Kit Issued' : deskType === 'food' ? 'Food Redeemed' : 'Attendance',
      actionStatus: 'Success',
      details: `${deskType.toUpperCase()} verified & persisted to MongoDB database.`
    });

    const formattedAttendedTime = matchedRegistration.attendedAt
      ? new Date(matchedRegistration.attendedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : null;

    const eventTitle = (eventDoc as any)?.title || 'Event';

    res.status(200).json({
      success: true,
      exists: true,
      alreadyAttended,
      message: alreadyAttended ? 'Already Attended' : 'Attendance Recorded Successfully.',
      eventTitle,
      participant: {
        id: matchedRegistration._id,
        registrationId: shortRegId,
        name: participantName,
        photo,
        organization,
        designation,
        mobile: mobile.trim() || matchedRegistration.participantPhone,
        phone: matchedRegistration.participantPhone || mobile.trim(),
        email: regData.email || matchedRegistration.participantEmail || 'N/A',
        category: matchedRegistration.category || 'General',
        eventTitle,
        registeredAt: matchedRegistration.registeredAt || (matchedRegistration as any).createdAt || new Date(),
        attended: matchedRegistration.attended,
        attendedAt: matchedRegistration.attendedAt,
        attendedDate: matchedRegistration.attendedDate,
        attendedTime: matchedRegistration.attendedTime || (matchedRegistration.attendedAt ? new Date(matchedRegistration.attendedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''),
        formattedAttendedTime,
        kitIssued: !!matchedRegistration.kitIssued,
        kitIssuedAt: matchedRegistration.kitIssuedAt,
        kitIssuedDate: matchedRegistration.kitIssuedDate,
        kitIssuedTime: matchedRegistration.kitIssuedTime || (matchedRegistration.kitIssuedAt ? new Date(matchedRegistration.kitIssuedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''),
        foodRedeemed: !!(matchedRegistration.foodRedeemed || matchedRegistration.couponIssued),
        foodRedeemedAt: matchedRegistration.foodRedeemedAt,
        foodRedeemedDate: matchedRegistration.foodRedeemedDate,
        foodRedeemedTime: matchedRegistration.foodRedeemedTime || (matchedRegistration.foodRedeemedAt ? new Date(matchedRegistration.foodRedeemedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''),
        kitQr: matchedRegistration.kitQrCodeDataUrl ? {
          token: matchedRegistration.kitQrToken,
          dataUrl: matchedRegistration.kitQrCodeDataUrl
        } : null,
        foodQr: matchedRegistration.foodQrCodeDataUrl ? {
          token: matchedRegistration.foodQrToken,
          dataUrl: matchedRegistration.foodQrCodeDataUrl
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify participant.' });
  }
};

/**
 * Public endpoint: Mark attendance for a verified participant.
 * Used on venue entrance landing page.
 * Automatically generates 2 unique encrypted QR codes (Kit Collection & Food Coupon) and stores them in MongoDB.
 * Prevents duplicate attendance.
 */
export const markSelfAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const { attendedBy: customAttendedBy } = req.body || {};

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      await recordEventAction({
        actionType: 'Attendance',
        actionStatus: 'Registration Not Found',
        details: `Registration record not found for ID: ${registrationId}`
      });
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});
    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';
    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;

    // Prevent duplicate attendance
    if (registration.attended) {
      const formattedTime = registration.attendedAt
        ? new Date(registration.attendedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : (registration.attendedTime ? `${registration.attendedDate} ${registration.attendedTime}` : 'earlier');

      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName,
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Attendance',
        actionStatus: 'Failed',
        details: `Duplicate attendance attempt. Attendance was already marked on ${formattedTime}.`
      });

      const kitQr = registration.kitQrCodeDataUrl ? {
        token: registration.kitQrToken,
        dataUrl: registration.kitQrCodeDataUrl
      } : null;

      const foodQr = registration.foodQrCodeDataUrl ? {
        token: registration.foodQrToken,
        dataUrl: registration.foodQrCodeDataUrl
      } : null;

      res.status(400).json({
        error: 'Attendance already marked.',
        alreadyMarked: true,
        attendedAt: registration.attendedAt,
        formattedTime,
        message: `Attendance was already marked on ${formattedTime}.`,
        kitQr,
        foodQr
      });
      return;
    }

    // Prepare Date, Time, and Admin recorder values
    const now = new Date();
    const attendedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const attendedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const attendedBy   = customAttendedBy || 'Admin / Entrance Gate';

    let wasAlreadyKitIssued = registration.kitIssued;
    registration.attended = true;
    registration.attendedAt = now;
    registration.attendedDate = attendedDate;
    registration.attendedTime = attendedTime;
    registration.attendedBy = attendedBy;

    if (!registration.kitIssued) {
      registration.kitIssued = true;
      registration.kitIssuedAt = now;
      registration.kitIssuedDate = attendedDate;
      registration.kitIssuedTime = attendedTime;
      registration.kitIssuedBy = attendedBy;
      registration.kitQrExpired = true;
    }

    const hostUrl = getAccessibleHostUrl(req);
    const targetEvtId = String(registration.eventId || '');

    // ── Automatically Generate Unique Encrypted Tokens & QR Data URLs ──
    // QR 1: Kit Collection
    if (!registration.kitQrToken || !registration.kitQrCodeDataUrl || registration.kitQrCodeDataUrl.length > 5000) {
      const kitWebUrl = `${hostUrl}/#kit-checkin/${targetEvtId}`;
      const kitDataUrl = await generateQrDataUrl(kitWebUrl);
      registration.kitQrToken = String(registration._id);
      registration.kitQrCodeDataUrl = kitDataUrl;
    }

    // QR 2: Food Coupon
    if (!registration.foodQrToken || !registration.foodQrCodeDataUrl || registration.foodQrCodeDataUrl.length > 5000) {
      const foodWebUrl = `${hostUrl}/#food-checkin/${targetEvtId}`;
      const foodDataUrl = await generateQrDataUrl(foodWebUrl);
      registration.foodQrToken = String(registration._id);
      registration.foodQrCodeDataUrl = foodDataUrl;
    }

    await registration.save();

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Attendance',
      actionStatus: 'Success',
      details: `Attendance marked successfully by ${attendedBy}`
    });

    broadcastRealtimeEvent('STATS_UPDATED', { action: 'ATTENDANCE', eventId: registration.eventId, registrationId: registration._id });

    // Increment scans / attendance and kits counter on Event model
    const incObj: any = { scansCount: 1 };
    if (!wasAlreadyKitIssued) incObj.kitsCount = 1;
    await Event.findByIdAndUpdate(registration.eventId, { $inc: incObj }).catch(() => null);

    res.status(200).json({
      success: true,
      message: `Your attendance has been recorded successfully.`,
      participantName,
      attendedDate,
      attendedTime,
      attendedBy,
      formattedTime: `${attendedDate}, ${attendedTime}`,
      kitQr: {
        token: registration.kitQrToken,
        dataUrl: registration.kitQrCodeDataUrl
      },
      foodQr: {
        token: registration.foodQrToken,
        dataUrl: registration.foodQrCodeDataUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark attendance.' });
  }
};

/**
 * Public endpoint: Spot / Walk-in Registration at venue entrance.
 * Saves participant with category 'Spot', auto-marks attendance, generates unique secure Kit QR.
 * Does not require mobile pre-verification.
 */
export const registerSpotParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { formData } = req.body;

    if (!formData) {
      await recordEventAction({
        eventId,
        actionType: 'Spot Registration',
        actionStatus: 'Failed',
        details: 'Missing form data'
      });
      res.status(400).json({ error: 'Form data is required for spot registration.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    if (event.status !== 'published') {
      await recordEventAction({
        eventId,
        actionType: 'Spot Registration',
        actionStatus: 'Failed',
        details: 'Spot registrations are not open for this event'
      });
      res.status(400).json({ error: 'Spot registrations are not open for this event.' });
      return;
    }

    // Check capacity (only enforce if capacity is set and > 0)
    const registrationCount = await Registration.countDocuments({ eventId });
    if (event.capacity && Number(event.capacity) > 0 && registrationCount >= Number(event.capacity)) {
      await recordEventAction({
        eventId,
        actionType: 'Spot Registration',
        actionStatus: 'Failed',
        details: 'Event maximum capacity reached'
      });
      res.status(400).json({ error: 'Event has reached maximum capacity.' });
      return;
    }

    // Validate required fields from event formSchema
    const validationErrors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const field of event.formSchema) {
      const value = formData[field.name];

      if (field.required && (value === undefined || value === null || value === '')) {
        validationErrors.push(`Field "${field.label}" is required.`);
        continue;
      }
      if (value !== undefined) {
        sanitizedData[field.name] = value;
      }
    }

    if (validationErrors.length > 0) {
      await recordEventAction({
        eventId,
        actionType: 'Spot Registration',
        actionStatus: 'Failed',
        details: `Validation errors: ${validationErrors.join(' ')}`
      });
      res.status(400).json({ error: validationErrors.join(' ') });
      return;
    }

    // Automatic Attendance Values
    const now = new Date();
    const attendedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const attendedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const extractedDetails = extractParticipantDetailsFromFormData(sanitizedData);
    const pName = extractedDetails.participantName;
    const pEmail = extractedDetails.participantEmail;
    const pPhone = extractedDetails.participantPhone;
    const regId = await generateStructuredRegistrationId(eventId, event.title);

    // Create Registration Document
    const registration = new Registration({
      registrationId: regId,
      eventId,
      participantName: pName,
      participantEmail: pEmail,
      participantPhone: pPhone,
      formData: sanitizedData,
      registeredAt: now,
      attended: true,
      attendedAt: now,
      attendedDate,
      attendedTime,
      attendedBy: 'Spot Registration / Walk-in',
      category: 'Spot',
      spotRegistration: true,
      kitIssued: true,
      kitIssuedAt: now,
      kitIssuedDate: attendedDate,
      kitIssuedTime: attendedTime,
      kitIssuedBy: 'Spot Registration / Walk-in',
      kitQrExpired: true,
      kitQrCreatedAt: now
    });

    const hostUrl = getAccessibleHostUrl(req);
    const targetEvtId = String(registration.eventId || eventId || '');

    const kitToken = String(registration._id);
    const foodToken = String(registration._id);

    // Generate Unique Secure Kit QR Token & Data URL
    const kitWebUrl = `${hostUrl}/#kit-checkin/${targetEvtId}`;
    const kitDataUrl = await generateQrDataUrl(kitWebUrl);

    registration.kitQrToken = kitToken;
    registration.kitQrCodeDataUrl = kitDataUrl;

    // Generate Encrypted Food QR Token & Data URL
    const foodWebUrl = `${hostUrl}/#food-checkin/${targetEvtId}`;
    const foodDataUrl = await generateQrDataUrl(foodWebUrl);
    registration.foodQrToken = foodToken;
    registration.foodQrCodeDataUrl = foodDataUrl;

    await registration.save();

    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;

    await recordEventAction({
      eventId,
      registrationId: shortRegId,
      participantName: pName,
      registeredMobileNumber: pPhone,
      actionType: 'Spot Registration',
      actionStatus: 'Success',
      details: 'Spot registration completed & attendance marked successfully'
    });

    broadcastRealtimeEvent('STATS_UPDATED', { action: 'SPOT_REGISTRATION', eventId, registrationId: registration._id });

    // Increment scans / attendance counter on Event model
    await Event.findByIdAndUpdate(eventId, { $inc: { scansCount: 1 } }).catch(() => null);

    res.status(201).json({
      success: true,
      message: 'Registration Successful',
      participantName: pName,
      registrationId: shortRegId,
      rawId: registration._id,
      eventTitle: event.title,
      attendedDate,
      attendedTime,
      attendedBy: registration.attendedBy,
      kitQr: {
        token: kitToken,
        dataUrl: kitDataUrl
      },
      foodQr: {
        token: foodToken,
        dataUrl: foodDataUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to complete spot registration.' });
  }
};

/**
 * Public/Admin endpoint: Scans/verifies a participant's Kit QR code token.
 * Returns participant details and whether Kit is issued or QR is expired.
 */
export const verifyKitQr = async (req: Request, res: Response): Promise<void> => {
  try {
    let { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      await recordEventAction({
        actionType: 'Kit Scan',
        actionStatus: 'Invalid Mobile',
        details: 'Kit QR token was not provided or empty.'
      });
      res.status(400).json({ error: 'Kit QR token is required.' });
      return;
    }

    let cleanToken = decodeURIComponent(token.trim());
    if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1];
      if (cleanToken.includes('&')) cleanToken = cleanToken.split('&')[0];
    }

    let registration;
    const payload = decryptToken(cleanToken);

    if (payload && payload.type === 'KIT_COLLECTION' && payload.registrationId) {
      registration = await Registration.findById(payload.registrationId).populate('eventId', 'title');
    } else {
      registration = await Registration.findOne({
        $or: [
          { kitQrToken: cleanToken },
          { _id: cleanToken.length === 24 ? cleanToken : null }
        ]
      }).populate('eventId', 'title');
    }

    if (!registration) {
      await recordEventAction({
        actionType: 'Kit Scan',
        actionStatus: 'Registration Not Found',
        details: `Invalid or unrecognized Kit QR Code token: "${cleanToken}"`
      });
      res.status(404).json({ error: 'Invalid or unrecognized Kit QR Code.' });
      return;
    }

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});

    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';
    const organization = regData.organization || regData.company || regData.college || 'N/A';
    const designation = regData.designation || regData.role || 'N/A';
    const photo = regData.photo || regData.profilePhoto || '';
    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;
    const eventTitle = (registration.eventId as any)?.title || 'Event';

    const isAlreadyIssued = registration.kitIssued || registration.kitQrExpired;

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Kit Scan',
      actionStatus: isAlreadyIssued ? 'Already Issued' : 'Success',
      details: isAlreadyIssued 
        ? `Kit QR code is EXPIRED. Kit was already issued on ${registration.kitIssuedDate} ${registration.kitIssuedTime} by ${registration.kitIssuedBy}.`
        : 'Kit QR code verified successfully.'
    });

    res.status(200).json({
      success: true,
      participant: {
        id: registration._id,
        registrationId: shortRegId,
        name: participantName,
        photo,
        organization,
        designation,
        eventTitle,
        category: registration.category || 'General',
        kitIssued: registration.kitIssued,
        kitQrExpired: registration.kitQrExpired || false,
        kitIssuedDate: registration.kitIssuedDate || '',
        kitIssuedTime: registration.kitIssuedTime || '',
        kitIssuedBy: registration.kitIssuedBy || '',
        formattedIssuedTime: registration.kitIssuedDate ? `${registration.kitIssuedDate} ${registration.kitIssuedTime}` : null
      },
      message: isAlreadyIssued 
        ? `Kit QR code is EXPIRED. Kit was already issued on ${registration.kitIssuedDate} ${registration.kitIssuedTime} by ${registration.kitIssuedBy}.`
        : 'Kit QR verified successfully. Ready to issue kit.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify Kit QR.' });
  }
};

/**
 * Public/Admin endpoint: Issue Kit to a verified participant.
 * Updates MongoDB: stores kitIssued = true, kitIssuedDate, kitIssuedTime, kitIssuedBy, expires QR (kitQrExpired = true).
 * Blocks duplicate scans.
 */
export const issueKit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId, issuedBy: customIssuedBy } = req.body;

    if (!registrationId) {
      await recordEventAction({
        actionType: 'Kit Issued',
        actionStatus: 'Failed',
        details: 'Registration ID is required to issue kit.'
      });
      res.status(400).json({ error: 'Registration ID is required.' });
      return;
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      await recordEventAction({
        actionType: 'Kit Issued',
        actionStatus: 'Registration Not Found',
        details: `Registration record not found for ID: ${registrationId}`
      });
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;

    // Prevent duplicate scans / issuance
    if (registration.kitIssued || registration.kitQrExpired) {
      const issuedTime = registration.kitIssuedDate 
        ? `${registration.kitIssuedDate} ${registration.kitIssuedTime}`
        : 'earlier';

      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName: registration.participantName || 'Participant',
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Kit Issued',
        actionStatus: 'Duplicate Scan',
        adminId: (req as AuthRequest).user?.id,
        adminUsername: customIssuedBy || (req as AuthRequest).user?.username || 'Registration Desk Admin',
        details: `Duplicate scan prevented! Kit was already issued on ${issuedTime} by ${registration.kitIssuedBy || 'Admin'}.`
      });

      res.status(400).json({
        error: 'Kit already issued. QR code is EXPIRED.',
        alreadyIssued: true,
        kitIssuedDate: registration.kitIssuedDate,
        kitIssuedTime: registration.kitIssuedTime,
        kitIssuedBy: registration.kitIssuedBy,
        message: `Duplicate scan prevented! Kit was already issued on ${issuedTime} by ${registration.kitIssuedBy || 'Admin'}.`
      });
      return;
    }

    const now = new Date();
    const issuedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const issuedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const issuedBy   = customIssuedBy || (req as AuthRequest).user?.username || 'Registration Desk Admin';

    registration.kitIssued = true;
    registration.kitIssuedAt = now;
    registration.kitIssuedDate = issuedDate;
    registration.kitIssuedTime = issuedTime;
    registration.kitIssuedBy = issuedBy;
    registration.kitQrExpired = true; // Expire Kit QR code

    // ── Automatically Generate One Food QR Upon Kit Issuance ──
    if (!registration.foodQrToken || !registration.foodQrCodeDataUrl) {
      const hostUrl = getAccessibleHostUrl(req);
      const foodWebUrl = `${hostUrl}/#food-checkin/${registration.eventId}`;
      const foodDataUrl = await generateQrDataUrl(foodWebUrl);

      registration.foodQrToken = String(registration._id);
      registration.foodQrCodeDataUrl = foodDataUrl;
      registration.foodQrCreatedAt = now;
      registration.couponIssued = true;
      registration.foodRedeemed = false;
    }

    await registration.save();

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});
    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Kit Issued',
      actionStatus: 'Success',
      adminId: (req as AuthRequest).user?.id,
      adminUsername: issuedBy,
      details: `Kit Issued successfully by ${issuedBy}`
    });

    broadcastRealtimeEvent('STATS_UPDATED', { action: 'KIT_ISSUE', eventId: registration.eventId, registrationId: registration._id });

    res.status(200).json({
      success: true,
      message: `Kit Issued successfully to ${participantName}! Food QR code generated automatically.`,
      participantName,
      kitIssued: true,
      kitIssuedDate: issuedDate,
      kitIssuedTime: issuedTime,
      kitIssuedBy: issuedBy,
      kitQrExpired: true,
      foodQrToken: registration.foodQrToken,
      foodRedeemed: registration.foodRedeemed
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to issue kit.' });
  }
};

/**
 * Public/Admin endpoint: Scans/verifies a participant's Food QR code token.
 * Returns participant details and whether Food Coupon is redeemed or QR is expired.
 */
export const verifyFoodQr = async (req: Request, res: Response): Promise<void> => {
  try {
    let { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      await recordEventAction({
        actionType: 'Food Scan',
        actionStatus: 'Invalid Mobile',
        details: 'Food QR token was not provided or empty.'
      });
      res.status(400).json({ error: 'Food QR token is required.' });
      return;
    }

    let cleanToken = decodeURIComponent(token.trim());
    if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1];
      if (cleanToken.includes('&')) cleanToken = cleanToken.split('&')[0];
    }

    let registration;
    const payload = decryptToken(cleanToken);

    if (payload && payload.type === 'FOOD_COUPON' && payload.registrationId) {
      registration = await Registration.findById(payload.registrationId).populate('eventId', 'title');
    } else {
      registration = await Registration.findOne({
        $or: [
          { foodQrToken: cleanToken },
          { _id: cleanToken.length === 24 ? cleanToken : null }
        ]
      }).populate('eventId', 'title');
    }

    if (!registration) {
      await recordEventAction({
        actionType: 'Food Scan',
        actionStatus: 'Registration Not Found',
        details: `Invalid or unrecognized Food Coupon QR Code token: "${cleanToken}"`
      });
      res.status(404).json({ error: 'Invalid or unrecognized Food Coupon QR Code.' });
      return;
    }

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});

    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';
    const organization = regData.organization || regData.company || regData.college || 'N/A';
    const designation = regData.designation || regData.role || 'N/A';
    const photo = regData.photo || regData.profilePhoto || '';
    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;
    const eventTitle = (registration.eventId as any)?.title || 'Event';
    const isAlreadyRedeemed = registration.foodRedeemed || registration.foodQrExpired;

    if (!registration.attended) {
      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName,
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Food Scan',
        actionStatus: 'Failed',
        details: 'Food QR verification blocked: Attendance not verified yet.'
      });
      res.status(400).json({
        success: false,
        requiresAttendance: true,
        error: 'Attendance Not Recorded! Participant must verify event check-in first before redeeming food coupon.',
        message: 'Attendance Not Recorded! Please complete Event Entrance Check-in first.'
      });
      return;
    }

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Food Scan',
      actionStatus: isAlreadyRedeemed ? 'Already Redeemed' : 'Success',
      details: isAlreadyRedeemed 
        ? `Food Coupon Already Redeemed on ${registration.foodRedeemedDate} ${registration.foodRedeemedTime} by ${registration.foodRedeemedBy}.`
        : 'Food QR code verified successfully.'
    });

    res.status(200).json({
      success: true,
      participant: {
        id: registration._id,
        registrationId: shortRegId,
        name: participantName,
        photo,
        organization,
        designation,
        eventTitle,
        category: registration.category || 'General',
        foodRedeemed: registration.foodRedeemed || false,
        couponIssued: registration.couponIssued,
        foodQrExpired: registration.foodQrExpired || false,
        foodRedeemedDate: registration.foodRedeemedDate || '',
        foodRedeemedTime: registration.foodRedeemedTime || '',
        foodRedeemedBy: registration.foodRedeemedBy || '',
        formattedRedeemedTime: registration.foodRedeemedDate ? `${registration.foodRedeemedDate} ${registration.foodRedeemedTime}` : null
      },
      message: isAlreadyRedeemed 
        ? `Food Coupon Already Redeemed. Redeemed on ${registration.foodRedeemedDate} ${registration.foodRedeemedTime} by ${registration.foodRedeemedBy}.`
        : 'Food QR verified successfully. Ready to redeem food coupon.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify Food QR.' });
  }
};

/**
 * Public/Admin endpoint: Redeem Food Coupon for a verified participant.
 * Updates MongoDB: stores foodRedeemed = true, foodRedeemedDate, foodRedeemedTime, foodRedeemedBy, expires QR (foodQrExpired = true).
 * Blocks duplicate redemptions.
 */
export const redeemFoodCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId, redeemedBy: customRedeemedBy } = req.body;

    if (!registrationId) {
      await recordEventAction({
        actionType: 'Food Redeemed',
        actionStatus: 'Failed',
        details: 'Registration ID is required to redeem food coupon.'
      });
      res.status(400).json({ error: 'Registration ID is required.' });
      return;
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      await recordEventAction({
        actionType: 'Food Redeemed',
        actionStatus: 'Registration Not Found',
        details: `Registration record not found for ID: ${registrationId}`
      });
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;

    // Block redemption if attendance is not marked yet
    if (!registration.attended) {
      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName: registration.participantName || 'Participant',
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Food Redeemed',
        actionStatus: 'Failed',
        details: 'Food redemption blocked: Attendance not verified yet.'
      });
      res.status(400).json({
        success: false,
        requiresAttendance: true,
        error: 'Attendance Not Recorded! Participant must complete Event Entrance Check-in first before redeeming food coupon.'
      });
      return;
    }

    // Prevent duplicate redemptions
    if (registration.foodRedeemed || registration.foodQrExpired) {
      const redeemedTime = registration.foodRedeemedDate 
        ? `${registration.foodRedeemedDate} ${registration.foodRedeemedTime}`
        : 'earlier';

      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName: registration.participantName || 'Participant',
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Food Redeemed',
        actionStatus: 'Duplicate Scan',
        adminId: (req as AuthRequest).user?.id,
        adminUsername: customRedeemedBy || (req as AuthRequest).user?.username || 'Catering Desk Staff',
        details: `Duplicate Food redemption prevented. Coupon was already redeemed on ${redeemedTime} by ${registration.foodRedeemedBy || 'Staff'}.`
      });

      res.status(400).json({
        error: 'Food Coupon Already Redeemed.',
        alreadyRedeemed: true,
        foodRedeemedDate: registration.foodRedeemedDate,
        foodRedeemedTime: registration.foodRedeemedTime,
        foodRedeemedBy: registration.foodRedeemedBy,
        message: `Food Coupon Already Redeemed on ${redeemedTime} by ${registration.foodRedeemedBy || 'Staff'}.`
      });
      return;
    }

    const now = new Date();
    const redeemedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const redeemedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const redeemedBy   = customRedeemedBy || (req as AuthRequest).user?.username || 'Catering Desk Staff';

    registration.foodRedeemed = true; // Redeemed = true
    registration.couponIssued = true;
    registration.foodRedeemedAt = now;
    registration.foodRedeemedDate = redeemedDate;
    registration.foodRedeemedTime = redeemedTime;
    registration.foodRedeemedBy = redeemedBy;
    registration.foodQrExpired = true; // Expire Food QR code

    await registration.save();

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});
    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Food Redeemed',
      actionStatus: 'Success',
      adminId: (req as AuthRequest).user?.id,
      adminUsername: redeemedBy,
      details: `Food Coupon redeemed successfully by ${redeemedBy}`
    });

    broadcastRealtimeEvent('STATS_UPDATED', { action: 'FOOD_REDEMPTION', eventId: registration.eventId, registrationId: registration._id });

    res.status(200).json({
      success: true,
      message: `Food Coupon Redeemed successfully for ${participantName}!`,
      participantName,
      foodRedeemed: true,
      couponIssued: true,
      foodRedeemedDate: redeemedDate,
      foodRedeemedTime: redeemedTime,
      foodRedeemedBy: redeemedBy,
      foodQrExpired: true
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to redeem food coupon.' });
  }
};

/**
 * Direct Scan Endpoint: POST /api/scan-kit or POST /api/registrations/scan-kit
 * Complete end-to-end kit scan & MongoDB update handler.
 * Logs debug info, verifies token, updates MongoDB test database (kitIssued=true, kitIssuedAt, kitIssuedBy),
 * expires QR token, broadcasts live stats, and returns status.
 */
export const scanKit = async (req: Request, res: Response): Promise<void> => {
  try {
    let { token, registrationId, issuedBy } = req.body;
    const rawToken = token || registrationId;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      console.log('[DEBUG QR SCAN]: Invalid Token (Empty/Missing)');
      await recordEventAction({
        actionType: 'Kit Scan',
        actionStatus: 'Invalid Mobile',
        details: 'Empty or invalid QR code token'
      });
      res.status(400).json({ error: 'Invalid QR Code', status: 'INVALID_TOKEN' });
      return;
    }

    let cleanToken = decodeURIComponent(rawToken.trim());
    if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1];
      if (cleanToken.includes('&')) cleanToken = cleanToken.split('&')[0];
    }
    cleanToken = cleanToken.trim().split('#')[0].split('?')[0];

    console.log('[DEBUG QR SCAN]: Received Token:', cleanToken);

    const isHexId = isValidObjectId(cleanToken);
    const payload = decryptToken(cleanToken);

    let registration = null;
    if (payload && payload.registrationId && isValidObjectId(payload.registrationId)) {
      registration = await Registration.findById(payload.registrationId);
    }

    if (!registration) {
      const orConditions: any[] = [
        { kitQrToken: cleanToken },
        { foodQrToken: cleanToken },
        { registrationId: cleanToken }
      ];
      if (isHexId) {
        orConditions.push({ _id: cleanToken });
      }
      registration = await Registration.findOne({ $or: orConditions });
    }

    if (!registration) {
      console.log('[DEBUG QR SCAN]: Registration Not Found for Token:', cleanToken);
      await recordEventAction({
        actionType: 'Kit Scan',
        actionStatus: 'Registration Not Found',
        details: `Kit QR scan failed. Registration not found for token: ${cleanToken}`
      });
      res.status(404).json({ error: 'Registration Not Found / Invalid QR', status: 'NOT_FOUND' });
      return;
    }

    console.log('[DEBUG QR SCAN]: Registration Found:', registration._id);

    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;

    // Verify Admin Assignment if request comes from an Event Admin
    const authReq = req as AuthRequest;
    if (authReq.user && authReq.user.role === 'admin' && authReq.user.assignedEvent) {
      if (String(registration.eventId) !== String(authReq.user.assignedEvent)) {
        await recordEventAction({
          eventId: registration.eventId,
          registrationId: shortRegId,
          actionType: 'Kit Scan',
          actionStatus: 'Failed',
          adminId: authReq.user.id,
          adminUsername: authReq.user.username,
          details: 'Access denied: Event admin mismatch'
        });
        res.status(403).json({
          error: 'Access Denied: You are not assigned to manage operations for this event.',
          status: 'EVENT_MISMATCH'
        });
        return;
      }
    }

    if (registration.kitIssued || registration.kitQrExpired) {
      console.log('[DEBUG QR SCAN]: Kit Already Used:', registration._id);
      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName: registration.participantName || 'Participant',
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Kit Issued',
        actionStatus: 'Duplicate Scan',
        adminId: authReq.user?.id,
        adminUsername: issuedBy || authReq.user?.username || 'Admin',
        details: `Duplicate Kit scan attempt. Kit already collected at ${registration.kitIssuedDate || ''} ${registration.kitIssuedTime || ''} by ${registration.kitIssuedBy || 'Admin'}`
      });
      res.status(400).json({
        error: 'Kit Already Collected',
        status: 'ALREADY_ISSUED',
        alreadyIssued: true,
        collectedAt: `${registration.kitIssuedDate || ''} ${registration.kitIssuedTime || ''}`.trim(),
        collectedBy: registration.kitIssuedBy || 'Admin'
      });
      return;
    }

    const now = new Date();
    const kitIssuedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const kitIssuedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const adminUser = issuedBy || (authReq.user?.username) || 'Admin / Kit Desk';

    registration.kitIssued = true;
    registration.kitIssuedAt = now;
    registration.kitIssuedDate = kitIssuedDate;
    registration.kitIssuedTime = kitIssuedTime;
    registration.kitIssuedBy = adminUser;
    registration.kitQrExpired = true;

    await registration.save();

    console.log('[DEBUG QR SCAN]: Kit Issued Successfully:', registration._id);

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});
    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Kit Issued',
      actionStatus: 'Success',
      adminId: authReq.user?.id,
      adminUsername: adminUser,
      details: `Kit issued successfully via scanner by ${adminUser}`
    });

    broadcastRealtimeEvent('STATS_UPDATED', {
      action: 'KIT_ISSUE',
      eventId: registration.eventId,
      registrationId: registration._id
    });

    res.status(200).json({
      success: true,
      status: 'Success',
      message: `Kit Issued successfully for ${participantName}`,
      participantName,
      registrationId: registration._id,
      kitIssued: true,
      kitIssuedAt: now,
      kitIssuedDate,
      kitIssuedTime,
      kitIssuedBy: adminUser
    });
  } catch (error: any) {
    console.error('[DEBUG QR SCAN ERROR]:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process Kit QR scan.' });
  }
};

export const scanFood = async (req: Request, res: Response): Promise<void> => {
  try {
    let { token, registrationId, redeemedBy } = req.body;
    const rawToken = token || registrationId;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      console.log('[DEBUG QR SCAN]: Invalid Token (Empty/Missing)');
      await recordEventAction({
        actionType: 'Food Scan',
        actionStatus: 'Invalid Mobile',
        details: 'Empty or invalid QR code token'
      });
      res.status(400).json({ error: 'Invalid QR Code', status: 'INVALID_TOKEN' });
      return;
    }

    let cleanToken = decodeURIComponent(rawToken.trim());
    if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1];
      if (cleanToken.includes('&')) cleanToken = cleanToken.split('&')[0];
    }
    cleanToken = cleanToken.trim().split('#')[0].split('?')[0];

    console.log('[DEBUG QR SCAN]: Received Token:', cleanToken);

    const isHexId = isValidObjectId(cleanToken);
    const payload = decryptToken(cleanToken);

    let registration = null;
    if (payload && payload.registrationId && isValidObjectId(payload.registrationId)) {
      registration = await Registration.findById(payload.registrationId);
    }

    if (!registration) {
      const orConditions: any[] = [
        { foodQrToken: cleanToken },
        { kitQrToken: cleanToken },
        { registrationId: cleanToken }
      ];
      if (isHexId) {
        orConditions.push({ _id: cleanToken });
      }
      registration = await Registration.findOne({ $or: orConditions });
    }

    if (!registration) {
      console.log('[DEBUG QR SCAN]: Registration Not Found for Token:', cleanToken);
      await recordEventAction({
        actionType: 'Food Scan',
        actionStatus: 'Registration Not Found',
        details: `Food QR scan failed. Registration not found for token: ${cleanToken}`
      });
      res.status(404).json({ error: 'Registration Not Found / Invalid QR', status: 'NOT_FOUND' });
      return;
    }

    console.log('[DEBUG QR SCAN]: Registration Found:', registration._id);

    const shortRegId = registration.registrationId || `#REG-${String(registration._id).substring(18).toUpperCase()}`;

    // Block scan if attendance is not recorded yet
    if (!registration.attended) {
      console.log('[DEBUG QR SCAN]: Attendance Not Recorded for Token:', cleanToken);
      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName: registration.participantName || 'Participant',
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Food Scan',
        actionStatus: 'Failed',
        details: 'Food QR scan blocked: Attendance not verified yet.'
      });
      res.status(400).json({
        error: 'Attendance Not Recorded! Participant must verify event check-in first before scanning food QR.',
        status: 'REQUIRES_ATTENDANCE',
        requiresAttendance: true
      });
      return;
    }

    // Verify Admin Assignment if request comes from an Event Admin
    const authReq = req as AuthRequest;
    if (authReq.user && authReq.user.role === 'admin' && authReq.user.assignedEvent) {
      if (String(registration.eventId) !== String(authReq.user.assignedEvent)) {
        await recordEventAction({
          eventId: registration.eventId,
          registrationId: shortRegId,
          actionType: 'Food Scan',
          actionStatus: 'Failed',
          adminId: authReq.user.id,
          adminUsername: authReq.user.username,
          details: 'Access denied: Event admin mismatch'
        });
        res.status(403).json({
          error: 'Access Denied: You are not assigned to manage operations for this event.',
          status: 'EVENT_MISMATCH'
        });
        return;
      }
    }

    if (registration.foodRedeemed || registration.foodQrExpired) {
      console.log('[DEBUG QR SCAN]: Food Coupon Already Redeemed:', registration._id);
      await recordEventAction({
        eventId: registration.eventId,
        registrationId: shortRegId,
        participantName: registration.participantName || 'Participant',
        registeredMobileNumber: registration.participantPhone || '',
        actionType: 'Food Redeemed',
        actionStatus: 'Duplicate Scan',
        adminId: authReq.user?.id,
        adminUsername: redeemedBy || authReq.user?.username || 'Staff',
        details: `Duplicate Food scan attempt. Coupon already redeemed at ${registration.foodRedeemedDate || ''} ${registration.foodRedeemedTime || ''} by ${registration.foodRedeemedBy || 'Staff'}`
      });
      res.status(400).json({
        error: 'Food Coupon Already Redeemed',
        status: 'ALREADY_ISSUED',
        alreadyRedeemed: true,
        collectedAt: `${registration.foodRedeemedDate || ''} ${registration.foodRedeemedTime || ''}`.trim(),
        collectedBy: registration.foodRedeemedBy || 'Staff'
      });
      return;
    }

    const now = new Date();
    const foodRedeemedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const foodRedeemedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const staffUser = redeemedBy || (authReq.user?.username) || 'Catering Desk Staff';

    registration.foodRedeemed = true;
    registration.couponIssued = true;
    registration.foodRedeemedAt = now;
    registration.foodRedeemedDate = foodRedeemedDate;
    registration.foodRedeemedTime = foodRedeemedTime;
    registration.foodRedeemedBy = staffUser;
    registration.foodQrExpired = true;

    await registration.save();

    console.log('[DEBUG QR SCAN]: Food Coupon Redeemed Successfully:', registration._id);

    const regData = registration.formData instanceof Map 
      ? Object.fromEntries(registration.formData) 
      : (registration.formData || {});
    const participantName = regData.name || regData.fullName || regData['Full Name'] || registration.participantName || 'Participant';

    await recordEventAction({
      eventId: registration.eventId,
      registrationId: shortRegId,
      participantName,
      registeredMobileNumber: registration.participantPhone || '',
      actionType: 'Food Redeemed',
      actionStatus: 'Success',
      adminId: authReq.user?.id,
      adminUsername: staffUser,
      details: `Food Coupon redeemed successfully via scanner by ${staffUser}`
    });

    broadcastRealtimeEvent('STATS_UPDATED', {
      action: 'FOOD_REDEMPTION',
      eventId: registration.eventId,
      registrationId: registration._id
    });

    res.status(200).json({
      success: true,
      status: 'Success',
      message: `Food Coupon Redeemed successfully for ${participantName}`,
      participantName,
      registrationId: registration._id,
      foodRedeemed: true,
      foodRedeemedAt: now,
      foodRedeemedDate,
      foodRedeemedTime,
      foodRedeemedBy: staffUser
    });
  } catch (error: any) {
    console.error('[DEBUG QR SCAN ERROR]:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process Food QR scan.' });
  }
};

/**
 * Mobile Admin Participant Verification Lookup Endpoint
 * Searches MongoDB by phone number or registration ID.
 * Returns complete participant document with all timestamps and status fields.
 */
export const lookupParticipantForVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    const searchVal = String(query || '').trim();

    if (!searchVal) {
      res.status(400).json({ error: 'Search value (Phone Number or Registration ID) is required.' });
      return;
    }

    const cleanDigits = searchVal.replace(/\D/g, '');
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    const phoneVariants = Array.from(new Set([
      searchVal.trim(),
      cleanDigits,
      last10,
      `+91${last10}`,
      `91${last10}`,
      `0${last10}`
    ])).filter(Boolean);

    const regIdVariants = Array.from(new Set([
      searchVal.trim(),
      searchVal.trim().toUpperCase(),
      searchVal.trim().toLowerCase()
    ])).filter(Boolean);

    const userReq = req as AuthRequest;
    let eventFilter: any = {};
    if (userReq.user) {
      const isSuperAdmin = userReq.user.role === 'super_admin' || (userReq.user.role as any) === 'superadmin';
      if (!isSuperAdmin) {
        const userDoc = await User.findById(userReq.user.id).lean();
        const assignedIds = userDoc?.assignedEventIds?.map(id => String(id)) || (userDoc?.assignedEventId ? [String(userDoc.assignedEventId)] : []);
        eventFilter = { eventId: { $in: assignedIds } };
      }
    }

    // Primary search: Fast MongoDB B-Tree index lookup
    let registration = await Registration.findOne({
      ...eventFilter,
      $or: [
        { participantPhone: { $in: phoneVariants } },
        { registrationId: { $in: regIdVariants } },
        { participantEmail: searchVal.trim().toLowerCase() },
        ...(/^[0-9a-fA-F]{24}$/.test(searchVal.trim()) ? [{ _id: searchVal.trim() }] : [])
      ]
    });

    // Secondary fallback search: formData indexed keys lookup
    if (!registration) {
      registration = await Registration.findOne({
        $or: [
          { 'formData.mobile': { $in: phoneVariants } },
          { 'formData.phone': { $in: phoneVariants } },
          { 'formData.Mobile Number': { $in: phoneVariants } },
          { 'formData.Phone': { $in: phoneVariants } },
          { 'formData.Mobile': { $in: phoneVariants } },
          { 'formData.contact': { $in: phoneVariants } }
        ]
      });
    }

    if (!registration) {
      res.status(404).json({ error: 'Participant Not Found. Please check the Phone Number or Registration ID and try again.' });
      return;
    }

    // Populate event title if missing
    let eventTitle = registration.eventTitle || 'Event';
    if (!registration.eventTitle && registration.eventId) {
      const ev = await Event.findById(registration.eventId).select('title');
      if (ev?.title) eventTitle = ev.title;
    }

    const formDataObj: any = registration.formData instanceof Map ? Object.fromEntries(registration.formData) : (registration.formData || {});

    // Robust extraction of details from formData if root fields were blank
    const extractedDetails = extractParticipantDetailsFromFormData(formDataObj);
    let phone = registration.participantPhone || extractedDetails.participantPhone;
    let name = (registration.participantName && registration.participantName !== 'Participant') ? registration.participantName : extractedDetails.participantName;
    let email = registration.participantEmail || extractedDetails.participantEmail;

    // Format timestamps for display
    const formatDateStr = (d?: Date) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const formatTimeStr = (d?: Date) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

    const registeredAtFormatted = registration.registeredAt
      ? `${formatDateStr(registration.registeredAt)} at ${formatTimeStr(registration.registeredAt)}`
      : '';

    const attendedAtFormatted = registration.attendedAt
      ? `${formatDateStr(registration.attendedAt)} at ${formatTimeStr(registration.attendedAt)}`
      : (registration.attendedTime ? `${registration.attendedDate || ''} at ${registration.attendedTime}` : '');

    const kitIssuedAtFormatted = registration.kitIssuedAt
      ? `${formatDateStr(registration.kitIssuedAt)} at ${formatTimeStr(registration.kitIssuedAt)}`
      : (registration.kitIssuedTime ? `${registration.kitIssuedDate || ''} at ${registration.kitIssuedTime}` : '');

    const foodRedeemedAtFormatted = (registration.foodRedeemedAt || registration.foodIssuedAt)
      ? `${formatDateStr(registration.foodRedeemedAt || registration.foodIssuedAt)} at ${formatTimeStr(registration.foodRedeemedAt || registration.foodIssuedAt)}`
      : (registration.foodRedeemedTime ? `${registration.foodRedeemedDate || ''} at ${registration.foodRedeemedTime}` : '');

    const mealType = formDataObj?.mealType || formDataObj?.foodType || formDataObj?.meal || 'Standard Veg / Refreshments';
    const couponNumber = registration.registrationId || (registration._id ? String(registration._id).slice(-8).toUpperCase() : 'CPN-001');

    res.status(200).json({
      success: true,
      participant: {
        id: String(registration._id),
        name,
        email: email || 'N/A',
        phone: phone || 'N/A',
        registrationId: registration.registrationId || String(registration._id),
        eventTitle,
        eventId: String(registration.eventId),
        registeredAt: registration.registeredAt,
        registeredAtFormatted,
        
        // Registration Status
        isRegistered: true,
        registrationStatusText: 'Registered',

        // Attendance Status
        attended: !!registration.attended,
        attendedAt: registration.attendedAt,
        attendedAtFormatted,
        attendedBy: registration.attendedBy || '',

        // Kit Status
        kitIssued: !!registration.kitIssued,
        kitIssuedAt: registration.kitIssuedAt,
        kitIssuedAtFormatted,
        kitIssuedBy: registration.kitIssuedBy || '',

        // Food Status
        foodRedeemed: !!(registration.foodRedeemed || registration.foodIssued || registration.couponIssued),
        foodRedeemedAt: registration.foodRedeemedAt || registration.foodIssuedAt,
        foodRedeemedAtFormatted,
        foodRedeemedBy: registration.foodRedeemedBy || registration.foodIssuedBy || '',
        couponNumber,
        mealType
      }
    });

  } catch (error: any) {
    console.error('[LOOKUP ERROR]:', error.message);
    res.status(500).json({ error: error.message || 'Failed to lookup participant record.' });
  }
};

// Delete a participant registration (Admin only)
export const deleteRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid registration ID.' });
      return;
    }

    const registration = await Registration.findById(id);
    if (!registration) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const eventId = registration.eventId;

    // Delete registration document
    await Registration.findByIdAndDelete(id);

    // Decrement event counts if applicable
    if (eventId) {
      const incFields: any = { registrationCount: -1 };
      if (registration.attended) incFields.scansCount = -1;
      if (registration.kitIssued) incFields.kitsCount = -1;
      if (registration.couponIssued || registration.foodRedeemed) incFields.foodCount = -1;

      await Event.findByIdAndUpdate(eventId, { $inc: incFields });
    }

    res.status(200).json({ message: 'Participant registration deleted successfully.', id });
  } catch (error: any) {
    console.error('[registration]: Error in deleteRegistration:', error.message);
    res.status(500).json({ error: error.message || 'Failed to delete participant registration.' });
  }
};

/**
 * GET /api/registrations/details/:id
 * Fetches full details of a single registration by _id or registrationId with form & event metadata.
 */
export const getSingleRegistrationDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let registration: any = null;

    if (isValidObjectId(id)) {
      registration = await Registration.findById(id).populate('eventId').lean();
    }
    if (!registration) {
      registration = await Registration.findOne({ registrationId: id.trim().toUpperCase() }).populate('eventId').lean();
    }
    if (!registration) {
      registration = await Registration.findOne({ registrationId: id.trim() }).populate('eventId').lean();
    }

    if (!registration) {
      res.status(404).json({ success: false, error: 'Participant registration record not found in database.' });
      return;
    }

    // Dynamic QR generation if missing on demand
    const hostUrl = getAccessibleHostUrl(req);
    const targetEvtId = String(registration.eventId?._id || registration.eventId || '');

    if (!registration.kitQrCodeDataUrl && registration.kitQrToken) {
      const kitWebUrl = `${hostUrl}/#kit-checkin/${targetEvtId}`;
      registration.kitQrCodeDataUrl = await generateQrDataUrl(kitWebUrl);
    }
    if (!registration.foodQrCodeDataUrl && registration.foodQrToken) {
      const foodWebUrl = `${hostUrl}/#food-checkin/${targetEvtId}`;
      registration.foodQrCodeDataUrl = await generateQrDataUrl(foodWebUrl);
    }

    let formSchema: any[] = [];
    if (registration.eventId && typeof registration.eventId === 'object' && (registration.eventId as any).assignedFormId) {
      try {
        const FormModel = mongoose.model('Form');
        const formDoc: any = await FormModel.findById((registration.eventId as any).assignedFormId).lean();
        if (formDoc && Array.isArray(formDoc.fields)) {
          formSchema = formDoc.fields;
        }
      } catch (err) {}
    }

    res.status(200).json({
      success: true,
      registration,
      formSchema
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch registration details.' });
  }
};

/**
 * POST /api/registrations/manual-search
 * Searches for an approved participant by registered mobile number for a specific event.
 */
export const manualSearchParticipant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mobileNumber, eventId } = req.body;

    if (!mobileNumber || !String(mobileNumber).trim()) {
      res.status(400).json({ error: 'Mobile number is required.' });
      return;
    }
    if (!eventId || !isValidObjectId(eventId)) {
      res.status(400).json({ error: 'Valid eventId is required.' });
      return;
    }

    const cleanMobile = String(mobileNumber).replace(/[^0-9]/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length < 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    // 1. Search across all registrations by mobile number (regex match)
    const mobileRegex = new RegExp(`${cleanMobile}$`, 'i');
    const allRegs = await Registration.find({
      $or: [
        { participantPhone: mobileRegex },
        { 'formData.participantPhone': mobileRegex },
        { 'formData.phone': mobileRegex },
        { 'formData.mobileNumber': mobileRegex },
        { 'formData.mobile': mobileRegex }
      ]
    }).sort({ registeredAt: -1 }).lean();

    if (!allRegs || allRegs.length === 0) {
      res.status(404).json({ error: 'No participant found with this mobile number.' });
      return;
    }

    // 2. Check if any registration belongs to the specified eventId
    const targetReg = allRegs.find(r => String(r.eventId) === String(eventId));
    if (!targetReg) {
      res.status(400).json({ error: 'Participant is not registered for this event.' });
      return;
    }

    // 3. Validate registration status (Only reject pending or rejected)
    const regStatus = (targetReg.status || 'approved').toLowerCase();
    if (regStatus === 'pending') {
      res.status(400).json({ error: 'Participant is not approved yet.' });
      return;
    }
    if (regStatus === 'rejected') {
      res.status(400).json({ error: 'Participant registration was rejected.' });
      return;
    }

    // 4. Fetch Event Title for clarity
    const evt = await Event.findById(eventId).select('title').lean();
    const eventTitle = evt?.title || targetReg.eventTitle || 'Selected Event';

    // 5. Check if attendance is ALREADY marked
    if (targetReg.attended) {
      const formattedDate = targetReg.attendedDate || (targetReg.attendedAt ? new Date(targetReg.attendedAt).toLocaleDateString('en-IN') : '');
      const formattedTime = targetReg.attendedTime || (targetReg.attendedAt ? new Date(targetReg.attendedAt).toLocaleTimeString('en-IN') : '');
      
      res.status(200).json({
        alreadyMarked: true,
        participant: {
          id: String(targetReg._id),
          name: targetReg.participantName || 'Participant',
          registrationId: targetReg.registrationId || `REG-${String(targetReg._id).slice(-6).toUpperCase()}`,
          phone: targetReg.participantPhone || cleanMobile,
          email: targetReg.participantEmail || '',
          eventTitle,
          eventId: String(targetReg.eventId),
          status: 'Approved',
          attended: true,
          attendanceMethod: targetReg.attendanceMethod || 'QR',
          attendedDate: formattedDate,
          attendedTime: formattedTime,
          attendedBy: targetReg.attendedBy || 'Admin'
        }
      });
      return;
    }

    // 6. Valid Approved/Registered Participant ready for manual attendance
    res.status(200).json({
      valid: true,
      participant: {
        id: String(targetReg._id),
        name: targetReg.participantName || 'Participant',
        registrationId: targetReg.registrationId || `REG-${String(targetReg._id).slice(-6).toUpperCase()}`,
        phone: targetReg.participantPhone || cleanMobile,
        email: targetReg.participantEmail || '',
        eventTitle,
        eventId: String(targetReg.eventId),
        status: 'Approved',
        attended: false,
        attendanceMethod: null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error searching participant.' });
  }
};

/**
 * POST /api/registrations/manual-checkin
 * Manually marks participant attendance by admin.
 */
export const manualMarkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationId, eventId } = req.body;

    if (!registrationId || !isValidObjectId(registrationId)) {
      res.status(400).json({ error: 'Valid registrationId is required.' });
      return;
    }
    if (!eventId || !isValidObjectId(eventId)) {
      res.status(400).json({ error: 'Valid eventId is required.' });
      return;
    }

    const reg = await Registration.findById(registrationId);
    if (!reg) {
      res.status(404).json({ error: 'Participant not found.' });
      return;
    }

    if (String(reg.eventId) !== String(eventId)) {
      res.status(400).json({ error: 'Participant is not registered for this event.' });
      return;
    }

    if (reg.attended) {
      res.status(400).json({ error: 'Attendance has already been marked.' });
      return;
    }

    const regStatus = (reg.status || 'approved').toLowerCase();
    if (regStatus === 'pending') {
      res.status(400).json({ error: 'Participant is not approved yet.' });
      return;
    }
    if (regStatus === 'rejected') {
      res.status(400).json({ error: 'Participant registration was rejected.' });
      return;
    }

    const now = new Date();
    const attendedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const attendedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const adminUsername = req.user?.username || 'Admin';

    reg.attended = true;
    reg.attendedAt = now;
    reg.attendedDate = attendedDate;
    reg.attendedTime = attendedTime;
    reg.attendedBy = adminUsername;
    reg.attendanceMethod = 'Manual';

    if (!reg.kitIssued) {
      reg.kitIssued = true;
      reg.kitIssuedAt = now;
      reg.kitIssuedDate = attendedDate;
      reg.kitIssuedTime = attendedTime;
      reg.kitIssuedBy = adminUsername;
      reg.kitQrExpired = true;
    }

    await reg.save();

    // Increment event scans / attendance counter
    await Event.findByIdAndUpdate(eventId, { $inc: { scansCount: 1, kitsCount: 1 } }).catch(() => null);

    // Audit log
    await logAdminAction(
      req.user!.id,
      adminUsername,
      'MANUAL_ATTENDANCE_MARKED',
      `Manual attendance marked for participant ${reg.participantName} (${reg.registrationId}) in event ${eventId}.`,
      req.ip || 'unknown'
    );

    recordEventAction({
      eventId: reg.eventId,
      registrationId: reg.registrationId || String(reg._id),
      participantName: reg.participantName || '',
      registeredMobileNumber: reg.participantPhone || '',
      actionType: 'Attendance',
      actionStatus: 'Success',
      details: `Manual attendance marked by ${adminUsername}`
    });

    broadcastRealtimeEvent('STATS_UPDATED', { action: 'ATTENDANCE', eventId: reg.eventId, registrationId: reg._id });
    clearDashboardCache();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully.',
      participant: {
        id: String(reg._id),
        name: reg.participantName,
        registrationId: reg.registrationId,
        attended: true,
        attendanceMethod: 'Manual',
        attendedDate,
        attendedTime,
        attendedBy: adminUsername
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error marking attendance manually.' });
  }
};












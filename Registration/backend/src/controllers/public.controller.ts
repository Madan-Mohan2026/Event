import { Request, Response } from 'express';
import { Event } from '../models/event.model';

/**
 * Computes public event status ('upcoming' | 'ongoing' | 'completed')
 * based on event date and endDate compared against current timestamp.
 */
function computeEventStatus(date: Date, endDate?: Date): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date();
  const start = new Date(date);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'ongoing';
  } else {
    return 'completed';
  }
}

/**
 * Transforms an internal Mongoose Event document into a sanitized Public EventItem
 * preventing exposure of internal tokens, admin information, or QR secrets.
 */
function mapToPublicEvent(ev: any, isList: boolean = true) {
  const computedStatus = computeEventStatus(ev.date, ev.endDate);

  const startDateStr = new Date(ev.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const endDateStr = ev.endDate
    ? new Date(ev.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : startDateStr;

  const formattedDate = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;

  let speakers: any[] = [];
  if (Array.isArray(ev.agenda) && ev.agenda.length > 0) {
    speakers = ev.agenda.map((sess: any, idx: number) => ({
      id: `spk-${idx + 1}`,
      name: sess.speaker || 'Featured Speaker',
      title: sess.title || 'Presenter',
      organization: ev.organizerName || 'Event Organizer',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
      bio: sess.description || ''
    }));
  } else if (ev.speakerDetails) {
    speakers = [
      {
        id: 'spk-1',
        name: ev.speakerDetails,
        title: 'Keynote Speaker',
        organization: ev.organizerName || 'Event Organizer',
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
        bio: ''
      }
    ];
  }

  const schedule = Array.isArray(ev.agenda)
    ? ev.agenda.map((sess: any, idx: number) => ({
        id: `sch-${idx + 1}`,
        time: `${sess.startTime || ''} - ${sess.endTime || ''}`,
        title: sess.title || 'Session',
        description: sess.description || '',
        speakerName: sess.speaker || '',
        room: sess.location || ''
      }))
    : [];

  let rawBanner = ev.bannerImage || '';
  let bannerUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';

  if (rawBanner && typeof rawBanner === 'string') {
    if (rawBanner.startsWith('/uploads')) {
      bannerUrl = `http://localhost:5000${rawBanner}`;
    } else if (rawBanner.startsWith('http://') || rawBanner.startsWith('https://')) {
      bannerUrl = rawBanner;
    } else if (rawBanner.startsWith('data:image/')) {
      bannerUrl = (isList && rawBanner.length > 2000) ? bannerUrl : rawBanner;
    }
  }

  return {
    id: String(ev._id),
    slug: ev.eventCode || `evt-${ev._id}`,
    title: ev.title,
    shortDescription: ev.description ? ev.description.substring(0, 160) + (ev.description.length > 160 ? '...' : '') : '',
    fullDescription: ev.description || '',
    bannerUrl,
    date: new Date(ev.date).toISOString().split('T')[0],
    formattedDate,
    time: ev.time ? (ev.endTime ? `${ev.time} - ${ev.endTime}` : ev.time) : '09:00 AM - 05:00 PM',
    venue: ev.location || 'Main Convention Center',
    address: ev.location || 'Main Convention Center',
    category: ev.category || 'AI & Tech',
    status: computedStatus,
    isFeatured: true,
    price: 'Free Registration',
    capacity: ev.capacity || 500,
    registeredCount: ev.scansCount || 0,
    speakers,
    schedule,
    faqs: [
      {
        id: 'faq-1',
        question: 'How do I complete my event registration?',
        answer: 'Click Register Now to complete your dynamic registration pass. Your scannable QR entry pass will be generated instantly.'
      }
    ],
    highlights: [
      'Interactive keynotes and expert sessions',
      'Networking opportunities with industry leads',
      'Contactless QR code venue check-in'
    ],
    contactEmail: ev.supportEmail || 'support@smartevents.io',
    contactPhone: ev.contactNumber || '+1 (800) 555-0199',
    tags: [ev.category, ev.participantType, ev.teamWide].filter(Boolean)
  };
}

/**
 * GET /api/public/events
 * Public API to fetch published public events with pagination, search, category, and status filters.
 */
export const getPublicEvents = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { category, status, searchQuery, search, featuredOnly, page, limit } = req.query;

    const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));

    // Fast B-tree indexed filter: published events only
    const filter: any = {
      status: { $in: ['published', 'Published', 'PUBLISHED'] }
    };

    if (category && String(category).toLowerCase() !== 'all') {
      filter.category = String(category);
    }

    const queryTerm = String(searchQuery || search || '').trim();
    if (queryTerm) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: queryTerm, $options: 'i' } },
            { description: { $regex: queryTerm, $options: 'i' } },
            { location: { $regex: queryTerm, $options: 'i' } },
            { category: { $regex: queryTerm, $options: 'i' } }
          ]
        }
      ];
    }

    console.time('[PUBLIC API] Event.find');
    const events = await Event.find(filter)
      .select('-checkinQrCodeDataUrl -kitQrCodeDataUrl -foodQrCodeDataUrl -formSchema')
      .sort({ date: 1 })
      .lean();
    console.timeEnd('[PUBLIC API] Event.find');

    console.time('[PUBLIC API] mapping');
    let mappedEvents = events.map(e => mapToPublicEvent(e, true));
    console.timeEnd('[PUBLIC API] mapping');

    if (status && ['upcoming', 'ongoing', 'completed'].includes(String(status).toLowerCase())) {
      const targetStatus = String(status).toLowerCase();
      mappedEvents = mappedEvents.filter(e => e.status === targetStatus);
    }

    if (featuredOnly === 'true') {
      mappedEvents = mappedEvents.filter(e => e.isFeatured);
    }

    const total = mappedEvents.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedEvents = mappedEvents.slice(startIndex, startIndex + limitNum);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PERF LOG] GET /api/public/events completed in ${Date.now() - startTime}ms (${paginatedEvents.length} events returned)`);
    }

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      events: paginatedEvents
    });
  } catch (error: any) {
    console.error('❌ [GET /api/public/events ERROR]:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve public events.' });
  }
};

/**
 * GET /api/public/events/:id
 * Public API to fetch full details for a single published public event by ID or code.
 */
export const getPublicEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const isObjectId = Boolean(id.match(/^[0-9a-fA-F]{24}$/));
    const queryCondition = isObjectId ? { _id: id } : { $or: [{ _id: id }, { eventCode: id }] };

    const event = await Event.findOne({
      ...queryCondition,
      status: { $regex: /^published$/i }
    }).lean();

    if (!event) {
      res.status(404).json({ success: false, error: 'Public event not found or is not published.' });
      return;
    }

    const publicEvent = mapToPublicEvent(event, false);
    res.status(200).json({ success: true, event: publicEvent });
  } catch (error: any) {
    console.error(`❌ [GET /api/public/events/${req.params.id} ERROR]:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve event details.' });
  }
};

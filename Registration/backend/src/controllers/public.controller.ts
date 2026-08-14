import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { Event } from '../models/event.model';
import { fetchS3BannersList, getS3ObjectStream } from '../services/s3Storage.service';

/**
 * Computes public event status ('upcoming' | 'ongoing' | 'completed')
 * based on event date and endDate compared against current timestamp.
 */
function computeEventStatus(date: Date, endDate?: Date): 'upcoming' | 'ongoing' | 'completed' {
  if (!date || isNaN(new Date(date).getTime())) {
    return 'upcoming';
  }
  const now = new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  let end: Date;
  if (endDate && !isNaN(new Date(endDate).getTime())) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
  }

  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'ongoing';
  } else {
    return 'completed';
  }
}

/**
 * Returns a high quality category-matched default banner image URL
 * when an event has no uploaded image.
 */
function getDefaultCategoryBanner(category?: string): string {
  const cat = (category || '').toUpperCase();
  if (cat.includes('STARTUP') || cat.includes('MSME') || cat.includes('INNOV')) {
    return 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80';
  }
  if (cat.includes('AI') || cat.includes('TECH') || cat.includes('DIGITAL')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  }
  if (cat.includes('GREEN') || cat.includes('ENERGY') || cat.includes('CLEAN')) {
    return 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80';
  }
  if (cat.includes('WOMEN') || cat.includes('LEADERSHIP')) {
    return 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80';
  }
  return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
}

/**
 * Transforms an internal Mongoose Event document into a sanitized Public EventItem.
 * Fetches and resolves banner images directly from AWS S3 bucket.
 */
function mapToPublicEvent(ev: any, _isList: boolean = true, s3Banners: any[] = []) {
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

  const regStartDateStr = ev.registrationStart
    ? new Date(ev.registrationStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : undefined;

  const regEndDateStr = ev.registrationEnd
    ? new Date(ev.registrationEnd).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : undefined;

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

  // Determine the backend base URL for proxying S3 images
  const backendBase = (process.env.PUBLIC_APP_URL || process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://event-hjoa.onrender.com' : 'http://localhost:5000')).replace(/\/$/, '');

  /**
   * Converts an S3 banner object into a backend-proxied URL.
   * Direct S3 URLs return 403 because the bucket has Block Public Access enabled,
   * so we proxy through /api/public/s3-banner/<key> which streams from S3 via the backend.
   */
  function toProxyUrl(s3Banner: { key: string }): string {
    return `${backendBase}/api/public/s3-banner/${s3Banner.key}`;
  }

  let rawBanner = ev.bannerImage || '';
  let bannerUrl = '';

  if (rawBanner && typeof rawBanner === 'string' && rawBanner.trim()) {
    const trimmed = rawBanner.trim();
    if (trimmed.startsWith('data:image/')) {
      bannerUrl = trimmed;
    } else if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads/')) {
      // Match local upload path to an S3 object and proxy it
      const filename = trimmed.split('/').pop();
      const s3Match = s3Banners.find(b => b.filename === filename || (b.key && b.key.includes(filename || '')));
      if (s3Match) {
        bannerUrl = toProxyUrl(s3Match);
      } else {
        // Fallback: serve from backend static uploads directory
        const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        bannerUrl = `${backendBase}${cleanPath}`;
      }
    } else if (trimmed.includes('.s3.') && trimmed.includes('amazonaws.com')) {
      // Already an S3 URL — extract the key and proxy it
      const keyMatch = trimmed.match(/amazonaws\.com\/(.+)$/);
      if (keyMatch) {
        bannerUrl = `${backendBase}/api/public/s3-banner/${keyMatch[1]}`;
      } else {
        bannerUrl = trimmed;
      }
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      bannerUrl = trimmed;
    }
  }

  // If bannerUrl is still empty, find a matching S3 banner and proxy it
  if (!bannerUrl) {
    const idMatch = s3Banners.find(b => b.eventId === String(ev._id) || (b.key && b.key.includes(String(ev._id))));
    if (idMatch) {
      bannerUrl = toProxyUrl(idMatch);
    } else {
      bannerUrl = getDefaultCategoryBanner(ev.category);
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
    registrationStartDate: regStartDateStr,
    registrationEndDate: regEndDateStr,
    time: ev.time ? (ev.endTime ? `${ev.time} - ${ev.endTime}` : ev.time) : '09:00 AM - 05:00 PM',
    venue: ev.location || 'Main Convention Center',
    address: ev.location || 'Main Convention Center',
    category: ev.category || 'AI & Tech',
    organizerTeam: ev.organizerTeam || ev.organizerName || ev.teamWide || 'All Teams',
    organizerName: ev.organizerName || ev.organizerTeam || '',
    eventType: ev.eventType || 'All Event Types',
    teamWide: ev.teamWide || '',
    participantType: ev.participantType || '',
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
      const cat = String(category).trim();
      filter.$or = [
        { category: { $regex: cat, $options: 'i' } },
        { participantType: { $regex: cat, $options: 'i' } }
      ];
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
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    console.timeEnd('[PUBLIC API] Event.find');

    // Fetch banner objects directly from AWS S3 bucket
    const s3Banners = await fetchS3BannersList();

    console.time('[PUBLIC API] mapping');
    let mappedEvents = events.map(e => mapToPublicEvent(e, true, s3Banners));
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

    // Fetch banner objects directly from AWS S3 bucket
    const s3Banners = await fetchS3BannersList();
    const publicEvent = mapToPublicEvent(event, false, s3Banners);

    res.status(200).json({ success: true, event: publicEvent });
  } catch (error: any) {
    console.error(`❌ [GET /api/public/events/${req.params.id} ERROR]:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve event details.' });
  }
};

/**
 * GET /api/public/s3-agenda/*
 * Proxy an agenda PDF from the private S3 bucket to the client.
 * Forces a file download (Content-Disposition: attachment) so the browser
 * saves the PDF instead of navigating to the raw S3 URL (which returns 403).
 */
export const serveS3Agenda = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawKey = req.params[0] || (req.params as any).key || '';
    if (!rawKey) {
      res.status(400).send('Agenda key is required.');
      return;
    }

    const s3Obj = await getS3ObjectStream(rawKey);

    if (!s3Obj) {
      // Fallback: Check local disk storage if AWS S3 stream is unconfigured or failed
      const filename = rawKey.split('/').pop() || '';
      const localCandidatePaths = [
        path.resolve(process.cwd(), 'uploads/agendas', filename),
        path.resolve(process.cwd(), 'uploads', filename),
        path.resolve(process.cwd(), rawKey)
      ];

      for (const filePath of localCandidatePaths) {
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
          const stat = fs.statSync(filePath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${filename || 'Event_Agenda.pdf'}"`);
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Cache-Control', 'private, max-age=3600');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      res.status(404).send('Agenda PDF not found.');
      return;
    }

    const filename = rawKey.split('/').pop() || 'Event_Agenda.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    if (s3Obj.contentLength) {
      res.setHeader('Content-Length', s3Obj.contentLength);
    }
    res.setHeader('Cache-Control', 'private, max-age=3600');
    s3Obj.stream.pipe(res);
  } catch (err: any) {
    console.error('❌ [serveS3Agenda ERROR]:', err);
    res.status(500).send('Error streaming agenda PDF.');
  }
};

/**
 * GET /api/public/s3-banner/*
 * Direct S3 banner streaming proxy endpoint.
 * Fetches requested image object directly from AWS S3 bucket and streams to client.
 */
export const serveS3Banner = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawKey = req.params[0] || (req.params as any).key || '';
    if (!rawKey) {
      res.status(400).send('Banner key is required.');
      return;
    }

    const s3Obj = await getS3ObjectStream(rawKey);
    if (!s3Obj) {
      res.status(404).send('Banner image not found on AWS S3.');
      return;
    }

    res.setHeader('Content-Type', s3Obj.contentType);
    if (s3Obj.contentLength) {
      res.setHeader('Content-Length', s3Obj.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    s3Obj.stream.pipe(res);
  } catch (err: any) {
    console.error('❌ [serveS3Banner ERROR]:', err);
    res.status(500).send('Error streaming banner image from AWS S3.');
  }
};


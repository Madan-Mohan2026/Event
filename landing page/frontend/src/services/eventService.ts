import type { EventItem, EventCategory, EventStatus, RegistrationFormData, RegistrationResult } from '../types/event';

const defaultProdBackend = 'https://event-hjoa.onrender.com';
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const rawApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (isLocalhost
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : defaultProdBackend);
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

export function resolveBannerUrl(url?: string): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${API_BASE_URL}${cleanPath}`;
  }
  return trimmed;
}

/**
 * EventService Layer - Integrated with Public Backend APIs
 */
export class EventService {
  /**
   * Fetch published events from the backend Public API with optional filtering
   */
  static async getEvents(params?: {
    category?: EventCategory;
    status?: EventStatus;
    searchQuery?: string;
    featuredOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<EventItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/api/public/events`);

      if (params?.category && params.category !== 'All') {
        url.searchParams.set('category', params.category);
      }
      if (params?.status) {
        url.searchParams.set('status', params.status);
      }
      if (params?.searchQuery) {
        url.searchParams.set('searchQuery', params.searchQuery);
      }
      if (params?.featuredOnly) {
        url.searchParams.set('featuredOnly', 'true');
      }
      if (params?.page) {
        url.searchParams.set('page', String(params.page));
      }
      if (params?.limit) {
        url.searchParams.set('limit', String(params.limit));
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Public API returned status ${response.status}`);
      }

      const data = await response.json();
      const rawList = data && Array.isArray(data.events) ? data.events : (Array.isArray(data) ? data : []);
      return rawList.map((ev: any) => ({
        ...ev,
        bannerUrl: resolveBannerUrl(ev.bannerUrl)
      })) as EventItem[];
    } catch (error) {
      console.error('❌ Failed to fetch public events from backend API:', error);
      return [];
    }
  }

  /**
   * Fetch a single published event by ID or code from the backend Public API
   */
  static async getEventById(idOrSlug: string): Promise<EventItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/events/${idOrSlug}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Public API returned status ${response.status}`);
      }

      const data = await response.json();
      const ev = data && data.success && data.event ? data.event : (data && data.id ? data : null);
      if (!ev) return null;
      return {
        ...ev,
        bannerUrl: resolveBannerUrl(ev.bannerUrl)
      } as EventItem;
    } catch (error) {
      console.error(`❌ Failed to fetch public event details for ${idOrSlug}:`, error);
      return null;
    }
  }

  /**
   * Get Registration URL for an event targeting existing Public Registration Page
   */
  static getRegistrationUrl(eventId: string): string {
    const defaultRegUrl = isLocalhost
      ? `${window.location.protocol}//${window.location.hostname}:5173`
      : 'https://event-admin-losq.onrender.com';
    const regBaseUrl = (import.meta.env.VITE_REGISTRATION_BASE_URL || defaultRegUrl).replace(/\/$/, '');
    return `${regBaseUrl}/#register/${eventId}`;
  }

  /**
   * Legacy offline/fallback registration result handler
   */
  static async registerForEvent(
    eventId: string,
    formData: RegistrationFormData
  ): Promise<RegistrationResult> {
    const event = await this.getEventById(eventId);
    const regId = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrValue = JSON.stringify({
      regId,
      eventId,
      eventTitle: event?.title || 'Smart Event',
      attendeeName: formData.fullName,
      email: formData.email
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}`;

    const result: RegistrationResult = {
      registrationId: regId,
      eventId,
      eventTitle: event?.title || 'Smart Event',
      eventBanner: event?.bannerUrl || '',
      eventDate: event?.formattedDate || '',
      eventTime: event?.time || '',
      eventVenue: event?.venue || '',
      attendee: formData,
      registeredAt: new Date().toISOString(),
      qrCodeUrl
    };

    localStorage.setItem(`registration_${regId}`, JSON.stringify(result));
    return result;
  }

  /**
   * Fetch a local registration result by ID
   */
  static async getRegistrationById(regId: string): Promise<RegistrationResult | null> {
    const data = localStorage.getItem(`registration_${regId}`);
    if (!data) return null;
    try {
      return JSON.parse(data) as RegistrationResult;
    } catch {
      return null;
    }
  }
}

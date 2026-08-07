export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

export type EventCategory = 
  | 'AI & Tech'
  | 'Startup & Innovation'
  | 'Smart Cities'
  | 'Green Energy'
  | 'Women Entrepreneurs'
  | 'Digital Transformation'
  | 'Leadership'
  | 'All';

export interface Speaker {
  id: string;
  name: string;
  title: string;
  organization: string;
  avatarUrl: string;
  bio?: string;
  linkedin?: string;
  twitter?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  speakerName?: string;
  room?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  bannerUrl: string;
  date: string;
  formattedDate: string;
  time: string;
  venue: string;
  address: string;
  category: EventCategory;
  status: EventStatus;
  isFeatured: boolean;
  price: string;
  capacity: number;
  registeredCount: number;
  speakers: Speaker[];
  schedule: ScheduleItem[];
  faqs: FAQ[];
  highlights: string[];
  contactEmail: string;
  contactPhone: string;
  tags: string[];
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  mobile: string;
  organization: string;
  designation: string;
  city: string;
  state: string;
}

export interface RegistrationResult {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventBanner: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  attendee: RegistrationFormData;
  registeredAt: string;
  qrCodeUrl: string;
}

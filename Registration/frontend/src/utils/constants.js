
// Application Constants
const defaultProdBackend = 'https://event-hjoa.onrender.com';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');

const rawApiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (isLocalhost
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : defaultProdBackend);

export const API_BASE = rawApiBase.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const DESK_TYPES = {
  ATTENDANCE: 'attendance',
  KIT: 'kit',
  FOOD: 'food'
};

export const EVENT_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const DEFAULT_HEADER_TITLE = 'Smart Event Registration System';


// Application Constants
// Dynamically uses host port 5000 for backend API requests
const rawApiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.port === '5173'
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : 'http://localhost:5000');

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

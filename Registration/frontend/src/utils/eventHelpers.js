import { showAlert, copyToClipboard } from './helpers.js';
import { getPublicBaseUrl } from './qrHelpers.js';
import { API_BASE } from './constants.js';

export function formatEventDate(dateStr) {
  if (!dateStr) return 'No Date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'No Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'No Date';
  }
}

export function truncateDescription(text, maxChars = 110) {
  if (!text || typeof text !== 'string') return 'No description provided for this event.';
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.substring(0, maxChars).trim() + '...';
}

export function getStatusBadgeConfig(status) {
  const isPublished = status === 'published';
  return {
    isPublished,
    label: isPublished ? 'Published' : 'Draft',
    className: isPublished ? 'status-published' : 'status-draft',
    icon: isPublished ? '●' : '●'
  };
}

export function getCategoryBadgeConfig(category) {
  const cat = (category || 'EVENT').toUpperCase();
  let bg = '#e0f2fe';
  let color = '#0369a1';
  let border = '#bae6fd';

  if (cat.includes('STARTUP')) {
    bg = '#eff6ff'; color = '#2563eb'; border = '#bfdbfe';
  } else if (cat.includes('WORKSHOP')) {
    bg = '#f0fdf4'; color = '#16a34a'; border = '#bbf7d0';
  } else if (cat.includes('HACKATHON')) {
    bg = '#faf5ff'; color = '#9333ea'; border = '#e9d5ff';
  } else if (cat.includes('DEWE')) {
    bg = '#fff7ed'; color = '#ea580c'; border = '#ffedd5';
  } else if (cat.includes('CHALLENGE') || cat.includes('INNOV')) {
    bg = '#e0e7ff'; color = '#4338ca'; border = '#c7d2fe';
  }

  return { label: cat, bg, color, border };
}

export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const apiBase = (import.meta.env.VITE_API_BASE_URL || API_BASE || (process.env.NODE_ENV === 'production' ? 'https://event-hjoa.onrender.com' : '')).replace(/\/$/, '');

  if (trimmed.includes('.s3.') && trimmed.includes('amazonaws.com')) {
    const keyMatch = trimmed.match(/amazonaws\.com\/(.+)$/);
    if (keyMatch) {
      return `${apiBase}/api/public/s3-banner/${keyMatch[1]}`;
    }
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${apiBase}${cleanPath}`;
  }

  return trimmed;
}

export async function copyEventLink(eventId) {
  if (!eventId) {
    showAlert('Invalid Event ID to copy link.', 'danger');
    return;
  }
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/#register/${eventId}`;
  await copyToClipboard(url, 'Public registration link copied to clipboard!');
}

export function getEventAbbreviation(event) {
  if (!event) return 'EVT';

  // 1. Use explicit short code/abbreviation if present in event object
  const explicitCode = event.shortCode || event.code || event.abbreviation || event.eventCode || event.shortTitle || event.prefix;
  if (explicitCode && typeof explicitCode === 'string' && explicitCode.trim().length > 0) {
    const clean = explicitCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length >= 2) return clean.slice(0, 4);
  }

  const rawTitle = (typeof event === 'string' ? event : (event.title || '')).trim();
  if (!rawTitle) return 'EVT';

  // Clean title: keep alphanumeric chars and spaces
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanTitle.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'EVT';

  // If 3 or more words, take initials (e.g., ANDHRA PRADESH INCUBATORS MEETUP -> APIM)
  if (words.length >= 3) {
    const initials = words.map(w => w[0]).join('').toUpperCase();
    if (initials.length >= 3 && initials.length <= 4) {
      return initials;
    } else if (initials.length > 4) {
      return initials.slice(0, 4);
    }
  }

  // For 1 or 2 words (e.g. "SECURESIGN INNOVATION", "TECH EXPO", "AI SUMMIT")
  const firstWord = words[0].toUpperCase();
  if (firstWord.length <= 4) {
    return firstWord; // "TECH EXPO" -> "TECH", "AI SUMMIT" -> "AI"
  } else {
    return firstWord.slice(0, 3); // "SECURESIGN INNOVATION" -> "SEC"
  }
}

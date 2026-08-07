import { showAlert, copyToClipboard } from './helpers.js';
import { getPublicBaseUrl } from './qrHelpers.js';

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
  if (url.startsWith('/uploads')) {
    const apiBase = window.env?.API_BASE_URL || 'http://localhost:5000';
    return `${apiBase.replace(/\/$/, '')}${url}`;
  }
  return url;
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

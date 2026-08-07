import { API_BASE } from './constants.js';

let cachedBaseUrl = null;

/**
 * Get Centralized Public Base URL for Frontend QR generation
 * 1. Reads VITE_PUBLIC_BASE_URL or VITE_APP_URL if defined
 * 2. Uses window.location.origin if page is already accessed via Network IP / domain
 * 3. Fetches /api/config/server-ip from backend to get LAN IP (e.g. http://192.168.x.x:5173)
 */
export async function getPublicBaseUrl() {
  const envUrl = import.meta.env.VITE_PUBLIC_BASE_URL || import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
      return trimmed;
    }
  }

  return window.location.origin;
}

/**
 * Validates base URL and builds target URL for QR Code.
 * Throws explicit error if URL or ID is invalid.
 */
export function buildQrUrl(baseUrl, routePath, targetId) {
  if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.startsWith('http')) {
    throw new Error(`Invalid Base URL for QR Generation: ${baseUrl}`);
  }
  if (!targetId || targetId.includes('<') || targetId.includes('>')) {
    throw new Error(`Invalid Target ID for QR Generation: ${targetId}`);
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const formattedRoute = routePath.startsWith('#') ? routePath : `#${routePath}`;
  return `${cleanBase}/${formattedRoute}/${targetId}`;
}

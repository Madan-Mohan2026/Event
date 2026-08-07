import { apiFetch } from './api.js';
import { API_BASE } from '../utils/constants.js';

/**
 * Fetch all QR codes for a given admin (super_admin only)
 * @param {string} adminId
 */
export async function getAdminQRCodes(adminId) {
  const res = await apiFetch(`/api/qr/${adminId}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch QR codes.');
  }
  return await res.json();
}

/**
 * Fetch a specific QR code for an admin+event pair (super_admin only)
 * @param {string} adminId
 * @param {string} eventId
 */
export async function getQRCode(adminId, eventId) {
  const res = await apiFetch(`/api/qr/${adminId}/${eventId}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch QR code.');
  }
  return await res.json();
}

/**
 * Regenerate a QR code for an admin+event pair (super_admin only)
 * @param {string} adminId
 * @param {string} eventId
 */
export async function regenerateQR(adminId, eventId) {
  const res = await apiFetch('/api/qr/regenerate', {
    method: 'POST',
    body: JSON.stringify({ adminId, eventId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to regenerate QR code.');
  return data;
}

/**
 * QR-authenticated login — validates QR token + admin credentials
 * @param {string} qrToken - encrypted token from the QR code URL
 * @param {string} email   - admin email
 * @param {string} password
 */
export async function qrLogin(qrToken, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/qr-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken, email, password })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/**
 * Validate a QR token without authentication (used on login page load)
 * @param {string} qrToken
 */
export async function validateQRToken(qrToken) {
  try {
    const res = await fetch(`${API_BASE}/api/qr/validate?token=${encodeURIComponent(qrToken)}`);
    const data = await res.json();
    return data;
  } catch {
    return { valid: false, error: 'Network error validating QR.' };
  }
}

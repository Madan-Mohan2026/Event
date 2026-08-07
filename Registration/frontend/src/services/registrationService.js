import { apiFetch } from './api.js';

export async function getRegistrations(eventId, queryParams = {}) {
  const queryParamsWithView = { view: 'list', ...queryParams };
  const query = new URLSearchParams(queryParamsWithView).toString();
  const res = await apiFetch(`/api/registrations/${eventId}${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch registrations');
  return await res.json();
}

export async function getAllRegistrations(queryParams = {}) {
  const queryParamsWithView = { view: 'list', ...queryParams };
  const query = new URLSearchParams(queryParamsWithView).toString();
  const res = await apiFetch(`/api/registrations${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch all registrations');
  return await res.json();
}

export async function registerForEvent(eventId, formData) {
  const res = await apiFetch(`/api/registrations/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ formData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit registration');
  return data;
}

export async function registerSpotParticipant(eventId, spotData) {
  const res = await apiFetch('/api/registrations/spot-register', {
    method: 'POST',
    body: JSON.stringify({ eventId, ...spotData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Spot registration failed');
  return data;
}

export async function verifyParticipantMobile(eventId, payload) {
  const res = await apiFetch(`/api/registrations/${eventId}/verify-mobile`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function markSelfAttendance(registrationId, body = {}) {
  const res = await apiFetch(`/api/registrations/${registrationId}/mark-attendance`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function verifyKitQr(token) {
  const res = await apiFetch('/api/registrations/kit/verify-qr', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function issueKit(registrationId) {
  const res = await apiFetch('/api/registrations/kit/issue', {
    method: 'POST',
    body: JSON.stringify({ registrationId })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function verifyFoodQr(token) {
  const res = await apiFetch('/api/registrations/food/verify-qr', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function redeemFoodCoupon(registrationId) {
  const res = await apiFetch('/api/registrations/food/redeem', {
    method: 'POST',
    body: JSON.stringify({ registrationId })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function scanKit(payload) {
  const res = await apiFetch('/api/registrations/scan-kit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function scanFood(payload) {
  const res = await apiFetch('/api/registrations/scan-food', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function lookupParticipantForVerification(query) {
  const res = await apiFetch('/api/registrations/verify-lookup', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function deleteRegistration(id) {
  const res = await apiFetch(`/api/registrations/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete registration');
  return data;
}

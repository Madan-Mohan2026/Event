import { apiFetch } from './api.js';
import {
  notifyRegistrationCreated,
  notifyRegistrationDeleted,
  notifyKitIssued,
  notifyFoodCouponRedeemed,
  notifyAttendanceMarked
} from './notificationService.js';

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
  const name = formData?.fullName || formData?.name || formData?.email || 'Attendee';
  notifyRegistrationCreated(name);
  return data;
}

export async function registerSpotParticipant(eventId, spotData) {
  const res = await apiFetch('/api/registrations/spot-register', {
    method: 'POST',
    body: JSON.stringify({ eventId, ...spotData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Spot registration failed');
  const name = spotData?.fullName || spotData?.name || spotData?.phone || 'Spot Registrant';
  notifyRegistrationCreated(name);
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
  if (res.ok) {
    notifyAttendanceMarked('Participant');
  }
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
  if (res.ok) {
    notifyKitIssued('Participant');
  }
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
  if (res.ok) {
    notifyFoodCouponRedeemed('Participant');
  }
  return { ok: res.ok, status: res.status, data };
}

export async function scanKit(payload) {
  const res = await apiFetch('/api/registrations/scan-kit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (res.ok && data.success) {
    notifyKitIssued(data.participantName || 'Participant');
  }
  return { ok: res.ok, status: res.status, data };
}

export async function scanFood(payload) {
  const res = await apiFetch('/api/registrations/scan-food', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (res.ok && data.success) {
    notifyFoodCouponRedeemed(data.participantName || 'Participant');
  }
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
  notifyRegistrationDeleted('Participant');
  return data;
}

export async function approveParticipant(id) {
  const res = await apiFetch(`/api/registrations/${id}/approve`, {
    method: 'PUT'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve participant');
  return data;
}

export async function rejectParticipant(id) {
  const res = await apiFetch(`/api/registrations/${id}/reject`, {
    method: 'PUT'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reject participant');
  return data;
}

export async function bulkApproveParticipants(registrationIds) {
  const res = await apiFetch('/api/registrations/bulk-approve', {
    method: 'PUT',
    body: JSON.stringify({ registrationIds })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk approve participants');
  return data;
}

export async function bulkRejectParticipants(registrationIds) {
  const res = await apiFetch('/api/registrations/bulk-reject', {
    method: 'PUT',
    body: JSON.stringify({ registrationIds })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk reject participants');
  return data;
}

export async function sendBulkEmail(registrationIds, subject, bodyText) {
  const res = await apiFetch('/api/registrations/bulk-email', {
    method: 'POST',
    body: JSON.stringify({ registrationIds, subject, bodyText })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to dispatch bulk email');
  return data;
}

export async function bulkImportParticipants(eventId, participants, defaultApprovalStatus = 'APPROVED', sendEmail = false) {
  const res = await apiFetch(`/api/registrations/events/${eventId}/bulk-import`, {
    method: 'POST',
    body: JSON.stringify({ participants, defaultApprovalStatus, sendEmail })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk import participants');
  return data;
}




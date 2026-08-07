import { apiFetch } from './api.js';

export async function getDashboardStats() {
  const res = await apiFetch('/api/dashboard/stats');
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || 'Failed to fetch dashboard stats');
  }
  return await res.json();
}

export async function getAuditLogs() {
  const res = await apiFetch('/api/admin/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return await res.json();
}

export async function getEventLogs() {
  const res = await apiFetch('/api/admin/event-logs');
  if (!res.ok) throw new Error('Failed to fetch event logs');
  return await res.json();
}

export async function exportRegistrationsCSV(eventId) {
  const endpoint = eventId ? `/api/registrations/${eventId}/export` : '/api/registrations/export';
  const res = await apiFetch(endpoint);
  if (!res.ok) throw new Error('Failed to export CSV');
  return await res.blob();
}

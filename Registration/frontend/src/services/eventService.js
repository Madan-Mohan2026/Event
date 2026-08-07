import { apiFetch } from './api.js';

export async function getEvents(status) {
  const param = status ? `view=list&status=${status}` : `view=list`;
  const res = await apiFetch(`/api/events?${param}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return await res.json();
}

export async function getEventById(id) {
  const res = await apiFetch(`/api/events/${id}`);
  if (!res.ok) throw new Error('Failed to fetch event details');
  return await res.json();
}

export async function createEvent(eventData) {
  const res = await apiFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create event');
  return data;
}

export async function updateEvent(id, eventData) {
  const res = await apiFetch(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update event');
  return data;
}

export async function deleteEvent(id) {
  const res = await apiFetch(`/api/events/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete event');
  return data;
}

export async function updateFormSchema(id, formSchema) {
  const res = await apiFetch(`/api/events/${id}/form-schema`, {
    method: 'PUT',
    body: JSON.stringify({ formSchema })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update form schema');
  return data;
}

export async function updateAgenda(id, agenda) {
  const res = await apiFetch(`/api/events/${id}/agenda`, {
    method: 'PUT',
    body: JSON.stringify({ agenda })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update agenda');
  return data;
}

export async function regenerateEventQr(id) {
  const res = await apiFetch(`/api/events/${id}/regenerate-qr`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to regenerate QR code');
  return data;
}

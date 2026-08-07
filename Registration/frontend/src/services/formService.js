import { apiFetch } from './api.js';

export async function fetchAllForms() {
  const res = await apiFetch('/api/forms');
  if (!res.ok) {
    throw new Error('Failed to fetch forms.');
  }
  const data = await res.json();
  const forms = Array.isArray(data) ? data : (data.forms || []);
  return forms;
}

export async function saveFormSchema(formId, formSchema, title) {
  const res = await apiFetch(`/api/forms/${formId}`, {
    method: 'PUT',
    body: JSON.stringify({ formSchema, title })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save form schema.');
  }
  return await res.json();
}

export async function createStandaloneForm(formData) {
  const res = await apiFetch('/api/forms', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create form.');
  }
  return await res.json();
}

export async function updateFormMetadata(formId, metadata) {
  const res = await apiFetch(`/api/forms/${formId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: metadata.title,
      description: metadata.description
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update form metadata.');
  }
  return await res.json();
}

export async function deleteFormSchema(formId) {
  const res = await apiFetch(`/api/forms/${formId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error('Failed to delete form.');
  }
  return await res.json();
}

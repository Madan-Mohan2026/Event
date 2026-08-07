import { apiFetch } from './api.js';

export async function loginUser(credentials) {
  const payload = {
    usernameOrEmail: credentials.usernameOrEmail || credentials.username || credentials.email,
    username: credentials.username || credentials.usernameOrEmail,
    password: credentials.password
  };
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('admin_token', data.token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }
  }
  return { ok: res.ok, status: res.status, data };
}

export function logoutUser() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('user');
  localStorage.removeItem('admin_user');
}

export async function getProfile() {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return null;
  return await res.json();
}

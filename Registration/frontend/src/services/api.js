import { API_BASE } from '../utils/constants.js';

const pendingRequests = new Map();

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function handleUnauthorizedResponse(response, endpoint) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  const maskedToken = token ? `${token.substring(0, 10)}...${token.substring(token.length - 6)}` : 'NONE';
  const decoded = token ? decodeJwt(token) : null;
  const role = decoded?.role || 'unknown';
  const exp = decoded?.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'N/A';

  let backendErrorMessage = 'OK';
  if (response.status >= 400) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      backendErrorMessage = data.error || data.message || `HTTP ${response.status}`;
    } catch (e) {}
  }

  // Debug Console Output as requested
  console.log(`[API RESPONSE DEBUG]
    Endpoint: ${endpoint}
    Status: ${response.status}
    Role: ${role}
    Masked JWT: ${maskedToken}
    Token Expiry: ${exp}
    Auth Header Present: ${Boolean(token)}
    Backend Error: "${backendErrorMessage}"`);

  // ONLY clear session and redirect on HTTP 401 (Unauthenticated / Expired Token)
  // or HTTP 403 with invalid/expired token error. HTTP 403 for permission denied preserves session!
  if (response.status === 401 || (response.status === 403 && backendErrorMessage === 'Token is invalid or expired.')) {
    const isAdmin = role === 'admin' || Boolean(localStorage.getItem('admin_token')) || window.location.hash.includes('admin');

    localStorage.removeItem('admin_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_user');

    try {
      import('../app.js').then(({ state }) => {
        state.token = null;
        state.user = null;
      });
    } catch (e) {}

    const redirectTarget = isAdmin ? '#login/admin' : '#login';

    if (window.location.hash !== redirectTarget && !endpoint.includes('/api/auth/login')) {
      const existingToast = document.getElementById('session-expired-toast');
      if (!existingToast) {
        const toast = document.createElement('div');
        toast.id = 'session-expired-toast';
        toast.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 99999;
          background: #fff1f2; color: #be123c; border: 1.5px solid #fda4af;
          padding: 14px 20px; border-radius: 12px; font-size: 13.5px; font-weight: 700;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-width: 380px;
          display: flex; align-items: center; gap: 10px;
          animation: toast-slide-in 0.25s ease-out;
        `;
        toast.innerHTML = `
          <span style="font-size:18px;">⏰</span>
          <span>Session expired. Please log in again.</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast?.remove(), 4000);
      }
      setTimeout(() => { window.location.hash = redirectTarget; }, 600);
    }
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  // In-flight GET request deduplication
  if (method === 'GET' && !options.body) {
    const cacheKey = `${url}:${token || ''}`;
    let response;

    if (pendingRequests.has(cacheKey)) {
      response = await pendingRequests.get(cacheKey);
      await handleUnauthorizedResponse(response, endpoint);
      return response.clone();
    }

    const fetchPromise = fetch(url, { ...options, method, headers }).finally(() => {
      pendingRequests.delete(cacheKey);
    });
    pendingRequests.set(cacheKey, fetchPromise);

    try {
      response = await fetchPromise;
      await handleUnauthorizedResponse(response, endpoint);
      return response.clone();
    } catch (err) {
      throw err;
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers
  });

  await handleUnauthorizedResponse(response, endpoint);
  return response;
}


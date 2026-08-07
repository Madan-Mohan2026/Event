// Application Core & State Engine
import { handleRoute } from './router/routes.js';
import { logoutUser } from './services/authService.js';
import { API_BASE } from './utils/constants.js';

export const state = {
  user: null,
  token: null,
  isSetupRequired: false,
  activeView: 'dashboard',
  currentEvent: null
};

export function navigate(hash) {
  window.location.hash = hash;
}

let sseConnection = null;

export function triggerRealtimeSync(action, details = {}) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('smart_event_registration_realtime_sync');
      channel.postMessage({ type: 'STATS_UPDATED', action, details, timestamp: Date.now() });
    }
  } catch (err) {}
}

if (typeof window !== 'undefined') {
  window.triggerRealtimeSync = triggerRealtimeSync;
}

export function initRealtimeSync() {
  if (!document.getElementById('modal-holder')) {
    const mh = document.createElement('div');
    mh.id = 'modal-holder';
    document.body.appendChild(mh);
  }

  if (typeof EventSource !== 'undefined' && !sseConnection) {
    try {
      sseConnection = new EventSource(`${API_BASE}/api/admin/sse-stream`);
      sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATS_UPDATED') {
            handleRoute(state);
          }
        } catch (err) {}
      };
    } catch (e) {}
  }
}

export function initApp() {
  state.token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token');
  const storedUser = localStorage.getItem('user') || localStorage.getItem('admin_user');
  if (storedUser) {
    try {
      state.user = JSON.parse(storedUser);
    } catch (e) {}
  }

  // Restore currentEvent from localStorage (set after QR login)
  const storedEventId = localStorage.getItem('current_event_id');
  if (storedEventId && !state.currentEvent) {
    state.currentEvent = { _id: storedEventId };
  }

  initRealtimeSync();

  window.addEventListener('hashchange', () => handleRoute(state));
  handleRoute(state);
}

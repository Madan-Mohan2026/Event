// Application Entry Point
import './style.css';
import { initApp, state, navigate, triggerRealtimeSync } from './app.js';
import { apiFetch } from './services/api.js';
import { showAlert } from './utils/helpers.js';

export { state, navigate, apiFetch, showAlert, triggerRealtimeSync };

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
}

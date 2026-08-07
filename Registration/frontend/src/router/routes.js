import { initMobileSidebarToggle } from '../utils/helpers.js';

// Module cache to avoid re-downloading dynamic chunks
const routeModuleCache = new Map();

async function loadRouteModule(importFn) {
  if (routeModuleCache.has(importFn)) {
    return routeModuleCache.get(importFn);
  }
  const mod = await importFn();
  routeModuleCache.set(importFn, mod);
  return mod;
}

export async function handleRoute(state) {
  initMobileSidebarToggle();
  const hash = window.location.hash || (state.token ? '#dashboard' : '#login');

  // Extract qrToken from hash query string (e.g. #login?qrToken=...)
  let qrToken = null;
  const qIndex = hash.indexOf('?');
  const baseHash = qIndex !== -1 ? hash.slice(0, qIndex) : hash;
  if (qIndex !== -1) {
    try {
      const searchParams = new URLSearchParams(hash.slice(qIndex + 1));
      qrToken = searchParams.get('qrToken') || null;
    } catch {}
  }

  // Public Event Registration Route
  if (baseHash.startsWith('#register/')) {
    const eventId = baseHash.split('/')[1];
    const { renderPublicRegistrationPage } = await loadRouteModule(() => import('../components/forms/PublicRegistration.js'));
    return renderPublicRegistrationPage(eventId);
  }

  // Public & Auth Routes
  if (baseHash === '#login' || baseHash === '#login/super-admin' || baseHash === '#superadmin/login') {
    const { renderAdminLoginPage, renderSuperAdminLoginPage } = await loadRouteModule(() => import('../pages/AuthPages.js'));
    if (qrToken) {
      return renderAdminLoginPage('', qrToken);
    }
    return renderSuperAdminLoginPage();
  }
  if (baseHash === '#login/admin' || baseHash === '#admin/login') {
    const { renderAdminLoginPage } = await loadRouteModule(() => import('../pages/AuthPages.js'));
    return renderAdminLoginPage('', qrToken);
  }
  if (baseHash === '#home' || baseHash === '') {
    const { renderHomePage } = await loadRouteModule(() => import('../pages/AuthPages.js'));
    return renderHomePage();
  }
  if (baseHash === '#setup') {
    const { renderSetupPage } = await loadRouteModule(() => import('../pages/AuthPages.js'));
    return renderSetupPage();
  }

  // Attendance & Desk Routes
  if (baseHash.startsWith('#attendance/') || baseHash.startsWith('#checkin/') || baseHash.startsWith('#event-checkin/')) {
    const eventId = baseHash.split('/')[1];
    const { renderAttendancePage } = await loadRouteModule(() => import('../pages/Attendance.js'));
    return renderAttendancePage(eventId, 'attendance');
  }
  if (baseHash.startsWith('#kit-checkin/') || baseHash.startsWith('#kit/')) {
    const eventId = baseHash.split('/')[1];
    const { renderKits } = await loadRouteModule(() => import('../pages/Kits.js'));
    return renderKits(eventId);
  }
  if (baseHash.startsWith('#food-checkin/') || baseHash.startsWith('#food/') || baseHash.startsWith('#food-counter/')) {
    const eventId = baseHash.split('/')[1];
    const { renderAttendancePage } = await loadRouteModule(() => import('../pages/Attendance.js'));
    return renderAttendancePage(eventId, 'food');
  }

  // Auth Guard for Protected Admin Views
  if (!state.token) {
    window.location.hash = '#login';
    const { renderSuperAdminLoginPage } = await loadRouteModule(() => import('../pages/AuthPages.js'));
    return renderSuperAdminLoginPage();
  }

  // ── Role-Based Routing Guard for Event Admin (role === 'admin') ──────────
  const isEventAdmin = state.user?.role === 'admin';
  if (isEventAdmin) {
    if (baseHash === '#admin-verify') {
      state.activeView = 'admin-verify';
      const { renderAdminParticipantVerification } = await loadRouteModule(() => import('../pages/AdminVerification.js'));
      return renderAdminParticipantVerification();
    }
    if (baseHash === '#manual-attendance') {
      state.activeView = 'manual-attendance';
      const { renderManualAttendance } = await loadRouteModule(() => import('../pages/ManualAttendance.js'));
      return renderManualAttendance();
    }
    if (baseHash === '#admin-profile' || baseHash === '#profile') {
      state.activeView = 'admin-profile';
      const { renderAdminProfile } = await loadRouteModule(() => import('../pages/AdminDashboard.js'));
      return renderAdminProfile();
    }
    // Default route for Event Admin (handles #admin-dashboard, #dashboard, #admin-portal, or fallbacks)
    state.activeView = 'admin-dashboard';
    const { renderAdminDashboard } = await loadRouteModule(() => import('../pages/AdminDashboard.js'));
    return renderAdminDashboard();
  }

  // Super Admin Routes
  if (baseHash === '#events' || baseHash === '#create-event') {
    state.activeView = 'events';
    const { renderEvents } = await loadRouteModule(() => import('../pages/Events.js'));
    return renderEvents(state);
  }
  if (baseHash.startsWith('#registrations')) {
    state.activeView = 'registrations';
    const { renderRegistrations } = await loadRouteModule(() => import('../pages/Registrations.js'));
    return renderRegistrations(state);
  }
  if (baseHash.startsWith('#forms') || baseHash.startsWith('#form-studio') || baseHash.startsWith('#preview-form') || baseHash.startsWith('#form-preview')) {
    state.activeView = 'forms';
    const { renderForms } = await loadRouteModule(() => import('../pages/Forms.js'));
    return renderForms(state);
  }
  if (baseHash === '#guests') {
    state.activeView = 'guests';
    const { renderGuests } = await loadRouteModule(() => import('../pages/Guests.js'));
    return renderGuests(state);
  }
  if (baseHash === '#agenda') {
    state.activeView = 'agenda';
    const { renderAgenda } = await loadRouteModule(() => import('../pages/Agenda.js'));
    return renderAgenda(state);
  }
  if (baseHash === '#feedback') {
    state.activeView = 'feedback';
    const { renderFeedback } = await loadRouteModule(() => import('../pages/Feedback.js'));
    return renderFeedback(state);
  }
  if (baseHash === '#users' || baseHash === '#audit-logs' || baseHash === '#admin-users') {
    state.activeView = 'users';
    const { renderUsers } = await loadRouteModule(() => import('../pages/Users.js'));
    return renderUsers(state);
  }
  if (baseHash === '#analytics') {
    state.activeView = 'analytics';
    const { renderAnalytics } = await loadRouteModule(() => import('../pages/Analytics.js'));
    return renderAnalytics(state);
  }

  // Admin Portal Route
  if (baseHash.startsWith('#admin-portal')) {
    const parts = baseHash.split('/');
    const eventId = parts[1];
    const { renderAdminDashboard } = await loadRouteModule(() => import('../pages/AdminDashboard.js'));
    return renderAdminDashboard(eventId);
  }

  // Default Dashboard
  state.activeView = 'dashboard';
  const { renderDashboard } = await loadRouteModule(() => import('../pages/Dashboard.js'));
  return renderDashboard();
}

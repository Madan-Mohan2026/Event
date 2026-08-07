import { state } from '../app.js';

export function renderSidebar(activeViewId, user) {
  const currentUser = user || state.user || {};
  const isEventAdmin = currentUser.role === 'admin';

  if (isEventAdmin) {
    const eventTitle = state.currentEvent?.title || 'Assigned Event';

    const nav = (id, icon, label) => `
      <li style="border-radius:10px;overflow:hidden;">
        <a href="#${id}" style="color:${activeViewId===id?'#ffffff':'#94a3b8'};background:${activeViewId===id?'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(79,70,229,0.15))':'transparent'};border-left:3px solid ${activeViewId===id?'#6366f1':'transparent'};padding:11px 14px;font-weight:600;font-size:13px;display:flex;align-items:center;gap:10px;border-radius:10px;text-decoration:none;transition:all 0.2s;">
          <span style="font-size:16px;">${icon}</span><span>${label}</span>
        </a>
      </li>`;

    return `
      <aside class="sidebar" style="background:linear-gradient(180deg,#0f172a 0%,#1a2540 100%);border-right:none;box-shadow:4px 0 24px rgba(0,0,0,0.18);display:flex;flex-direction:column;flex-shrink:0;">
        <div style="padding:20px 18px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:12px;">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(99,102,241,0.45);flex-shrink:0;">OP</div>
          <div>
            <div style="color:#f1f5f9;font-size:13px;font-weight:800;line-height:1.2;">Event Operations</div>
            <div style="color:#475569;font-size:11px;font-weight:600;margin-top:1px;">${eventTitle}</div>
          </div>
        </div>

        <ul style="list-style:none;padding:14px 10px;flex:1;overflow-y:auto;">
          <div style="color:#475569;font-size:10px;font-weight:700;letter-spacing:1px;padding:10px 12px 6px;text-transform:uppercase;">Attendance & Audit</div>
          ${nav('admin-verify','🔍','Participant Verification')}
          ${nav('manual-attendance','📋','Manual Attendance')}
          ${nav('admin-dashboard','📊','Dashboard')}
          <div style="color:#475569;font-size:10px;font-weight:700;letter-spacing:1px;padding:10px 12px 6px;text-transform:uppercase;">Account</div>
          ${nav('admin-profile','👤','Profile')}
        </ul>

        <div style="padding:14px 12px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);padding:9px 13px;border-radius:10px;">
            <span style="width:8px;height:8px;background:#10b981;border-radius:50%;display:inline-block;flex-shrink:0;animation:ops-pulse 2s infinite;box-shadow:0 0 6px #10b981;"></span>
            <span style="color:#6ee7b7;font-size:12px;font-weight:700;">Live Monitoring Active</span>
          </div>
        </div>
      </aside>
    `;
  }

  // Super Admin Sidebar
  const email = currentUser.email || 'superadmin@rtih';
  const initial = (currentUser.username || 'RTIH')[0].toUpperCase();

  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo-square">RT</div>
        <div class="sidebar-title">RTIH Events</div>
      </div>
      <ul class="sidebar-menu">
        <div class="sidebar-group-label">Overview</div>
        <li class="sidebar-item ${activeViewId === 'dashboard' ? 'active' : ''}">
          <a href="#dashboard">🏠 Dashboard</a>
        </li>
        
        <div class="sidebar-group-label">Management</div>
        <li class="sidebar-item ${activeViewId === 'events' ? 'active' : ''}">
          <a href="#events">📅 Events</a>
        </li>
        <li class="sidebar-item ${activeViewId === 'registrations' ? 'active' : ''}">
          <a href="#registrations">👥 Registrations</a>
        </li>
        <li class="sidebar-item ${activeViewId === 'forms' || activeViewId === 'form-studio' ? 'active' : ''}">
          <a href="#forms">📝 Forms</a>
        </li>
        
        <div class="sidebar-group-label">System</div>
        <li class="sidebar-item ${activeViewId === 'feedback' ? 'active' : ''}">
          <a href="#feedback">💬 Feedback</a>
        </li>
        <li class="sidebar-item ${activeViewId === 'audit-logs' ? 'active' : ''}">
          <a href="#audit-logs">🔒 Admin Users</a>
        </li>
      </ul>
      <div class="sidebar-footer">
        <div class="sidebar-profile">
          <div class="profile-avatar" style="background-color:#4f46e5;">${initial}</div>
          <div class="profile-info">
            <div class="profile-name">RTIH Super Admin</div>
            <div class="profile-email">${email}</div>
          </div>
        </div>
        <div class="sidebar-footer-actions">
          <button id="profile-btn" class="btn">Profile</button>
          <button id="logout-btn" class="btn">Log Out</button>
        </div>
      </div>
    </aside>
  `;
}


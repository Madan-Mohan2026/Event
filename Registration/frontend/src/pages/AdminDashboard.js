import { state, navigate } from '../app.js';
import { apiFetch } from '../services/api.js';
import { exportAdminRegistrationsToCSV, initMobileSidebarToggle, initHeaderBackButtons } from '../utils/helpers.js';
import { openMetricsDetailModal } from './Dashboard.js';

export function renderAdminPortalLayout(activeViewId, viewTitle, contentHTML) {
  const app = document.getElementById('app');
  const userInitials = state.user?.fullName?.substring(0, 2).toUpperCase() || 'A';
  const userName = state.user?.fullName || 'Event Admin';
  const eventTitle = state.currentEvent?.title || 'Assigned Event';

  const nav = (id, icon, label) => `
    <li style="border-radius:10px;overflow:hidden;">
      <a href="#${id}" style="color:${activeViewId===id?'#ffffff':'#94a3b8'};background:${activeViewId===id?'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(79,70,229,0.15))':'transparent'};border-left:3px solid ${activeViewId===id?'#6366f1':'transparent'};padding:11px 14px;font-weight:600;font-size:13px;display:flex;align-items:center;gap:10px;border-radius:10px;text-decoration:none;transition:all 0.2s;">
        <span style="font-size:16px;">${icon}</span><span>${label}</span>
      </a>
    </li>`;

  app.innerHTML = `
    <div class="admin-layout ops-panel-layout" style="display:flex;width:100%;height:100vh;overflow:hidden;">
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
      <aside class="sidebar" style="background:linear-gradient(180deg,#0f172a 0%,#1a2540 100%);border-right:none;box-shadow:4px 0 24px rgba(0,0,0,0.18);display:flex;flex-direction:column;flex-shrink:0;">
        <div style="padding:20px 18px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:12px;">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(99,102,241,0.45);flex-shrink:0;">OP</div>
          <div>
            <div style="color:#f1f5f9;font-size:13px;font-weight:800;line-height:1.2;">Event Operations</div>
            <div style="color:#475569;font-size:11px;font-weight:600;margin-top:1px;">Desk Control Panel</div>
          </div>
        </div>

        <ul style="list-style:none;padding:14px 10px;flex:1;overflow-y:auto;">
          <div style="color:#475569;font-size:10px;font-weight:700;letter-spacing:1px;padding:10px 12px 6px;text-transform:uppercase;">Monitoring & Audit</div>
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

      <main style="flex:1;min-width:0;width:100%;height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#f1f5f9;">
        <header style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(0,0,0,0.04);flex-shrink:0;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button id="ops-mobile-toggle-btn" class="mobile-hamburger-btn" aria-label="Toggle Sidebar">☰</button>
            <button id="header-back-btn" class="header-back-btn" aria-label="Go Back" title="Go Back">←</button>
            <h2 style="font-size:16px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;margin:0;">${viewTitle}</h2>
            <span style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);color:#4338ca;border:1px solid #c7d2fe;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:20px;">📍 ${eventTitle}</span>
          </div>

          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;background:#f8fafc;padding:3px 8px 3px 4px;border-radius:30px;border:1px solid #e2e8f0;">
              <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;box-shadow:0 2px 6px rgba(99,102,241,0.3);">${userInitials}</div>
              <div style="line-height:1.2;">
                <div style="font-size:11.5px;font-weight:700;color:#0f172a;">${userName}</div>
              </div>
            </div>
            <button id="header-export-excel-btn" style="background:#10b981;color:#ffffff;border:none;padding:4px 10px;border-radius:8px;font-weight:700;font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;box-shadow:0 2px 6px rgba(16,185,129,0.25);">📥 Excel</button>
            <button id="admin-logout-btn" style="display:inline-flex;align-items:center;gap:4px;background:#fff1f2;color:#e11d48;border:1px solid #fecdd3;padding:4px 10px;border-radius:8px;font-weight:700;font-size:11px;cursor:pointer;">
              Logout
            </button>
          </div>
        </header>

        <div style="flex:1;overflow-y:auto;padding:12px 8px;">
          ${contentHTML}
        </div>
      </main>
    </div>
  `;

  initMobileSidebarToggle();
  initHeaderBackButtons();

  // Export Excel / CSV button handler
  document.getElementById('header-export-excel-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('header-export-excel-btn');
    if (btn) { btn.disabled = true; btn.innerText = '⏳ Exporting...'; }
    try {
      const eventId = state.currentEvent?._id || '';
      const [regRes, dashRes] = await Promise.all([
        apiFetch(`/api/registrations${eventId ? '?eventId=' + eventId : ''}`),
        apiFetch(`/api/admin/dashboard${eventId ? '?eventId=' + eventId : ''}`)
      ]);
      const regData = await regRes.json();
      const dashData = await dashRes.json();
      const records = regData.registrations || regData.data || (Array.isArray(regData) ? regData : []);

      exportAdminRegistrationsToCSV(records, dashData, `${state.currentEvent?.title || 'Event'}_Registrations.csv`);
    } catch (err) {
      alert('⚠️ Export failed: ' + (err.message || 'Error generating file'));
    } finally {
      if (btn) { btn.disabled = false; btn.innerText = '📥 Export Excel'; }
    }
  });

  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('current_event_id');
    state.token = null;
    state.user = null;
    state.currentEvent = null;
    navigate('#login');
  });
}

export async function renderAdminDashboard() {
  renderAdminPortalLayout('dashboard', 'Operations Dashboard', `
    <div style="display:flex; align-items:center; justify-content:center; min-height:300px; color:#64748b; font-size:15px; gap:12px;">
      Fetching live operations data from MongoDB…
    </div>
  `);

  try {
    const eventId = state.currentEvent?._id || '';
    const res = await apiFetch(`/api/admin/dashboard${eventId ? '?eventId=' + eventId : ''}`);
    const data = await res.json();

    const dashboardHTML = `
      <div class="ops-kpi-grid">
        <div id="ops-card-total-regs" class="ops-kpi-card ops-kpi-blue" style="padding-top:26px; cursor:pointer;" title="Click to view total registered participants">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Total Registrations</span>
              <span style="font-size:32px;font-weight:900;color:#0f172a;line-height:1;">${data.totalRegistrations || 0}</span>
            </div>
            <div class="ops-icon-container ops-kpi-blue" style="background:#eef2ff;">📋</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Registered participants</div>
        </div>

        <div id="ops-card-today-attendance" class="ops-kpi-card ops-kpi-green" style="padding-top:26px; cursor:pointer;" title="Click to view checked-in participants">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;">Today's Attendance</span>
              <span style="font-size:32px;font-weight:900;color:#059669;line-height:1;">${data.todayAttendance || 0}</span>
            </div>
            <div class="ops-icon-container ops-kpi-green" style="background:#ecfdf5;">✅</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Checked-in today</div>
        </div>

        <div id="ops-card-spot-regs" class="ops-kpi-card ops-kpi-orange" style="padding-top:26px; cursor:pointer;" title="Click to view spot walk-in registrations">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;">Spot Registrations</span>
              <span style="font-size:32px;font-weight:900;color:#ea580c;line-height:1;">${data.spotRegistrations || 0}</span>
            </div>
            <div class="ops-icon-container" style="background:#fff7ed;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">⚡</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Walk-in spot registrations</div>
        </div>

        <div id="ops-card-kits" class="ops-kpi-card ops-kpi-purple" style="padding-top:26px; cursor:pointer;" title="Click to view kit issued participants">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;">Kit Distributed</span>
              <span style="font-size:32px;font-weight:900;color:#7c3aed;line-height:1;">${data.kitsIssued || 0}</span>
            </div>
            <div class="ops-icon-container" style="background:#f3e8ff;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">🎒</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Kits issued by staff</div>
        </div>

        <div id="ops-card-food" class="ops-kpi-card" style="padding-top:26px; cursor:pointer; background:#ffffff; border:1px solid #fed7aa;" title="Click to view food coupon redeemed participants">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;">Food Redeemed</span>
              <span style="font-size:32px;font-weight:900;color:#c2410c;line-height:1;">${data.foodRedeemed || 0}</span>
            </div>
            <div class="ops-icon-container" style="background:#fff7ed;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">🍽️</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Food coupons redeemed</div>
        </div>

        <div id="ops-card-pending-kit" class="ops-kpi-card" style="padding-top:26px; cursor:pointer; background:#ffffff; border:1px solid #fef08a;" title="Awaiting kit collection">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#ca8a04;text-transform:uppercase;">Pending Kit</span>
              <span style="font-size:32px;font-weight:900;color:#ca8a04;line-height:1;">${data.pendingKits || 0}</span>
            </div>
            <div class="ops-icon-container" style="background:#fef9c3;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">⏳</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Awaiting kit collection</div>
        </div>

        <div id="ops-card-pending-food" class="ops-kpi-card" style="padding-top:26px; cursor:pointer; background:#ffffff; border:1px solid #e0e7ff;" title="Awaiting food redemption">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#4338ca;text-transform:uppercase;">Pending Food</span>
              <span style="font-size:32px;font-weight:900;color:#4338ca;line-height:1;">${data.pendingFood || 0}</span>
            </div>
            <div class="ops-icon-container" style="background:#eef2ff;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">🍱</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Awaiting food redemption</div>
        </div>

        <div id="ops-card-visitors" class="ops-kpi-card" style="padding-top:26px; cursor:pointer; background:#ffffff; border:1px solid #a7f3d0;" title="Active hall visitors">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;">Live Visitors</span>
              <span style="font-size:32px;font-weight:900;color:#059669;line-height:1;">${data.liveVisitors || data.todayAttendance || 0}</span>
            </div>
            <div class="ops-icon-container" style="background:#ecfdf5;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">🟢</div>
          </div>
          <div style="font-size:12px;color:#94a3b8;font-weight:600;">Active hall visitors</div>
        </div>
      </div>
    `;

    renderAdminPortalLayout('dashboard', 'Operations Dashboard', dashboardHTML);

    document.getElementById('ops-card-total-regs')?.addEventListener('click', () => openMetricsDetailModal('total_registrations'));
    document.getElementById('ops-card-today-attendance')?.addEventListener('click', () => openMetricsDetailModal('attendance'));
    document.getElementById('ops-card-spot-regs')?.addEventListener('click', () => openMetricsDetailModal('total_registrations'));
    document.getElementById('ops-card-kits')?.addEventListener('click', () => openMetricsDetailModal('kits'));
  } catch (error) {
    renderAdminPortalLayout('dashboard', 'Operations Dashboard', `<div class="alert alert-danger">${error.message}</div>`);
  }
}

export function renderAdminProfile() {
  const user = state.user || {};
  const eventTitle = state.currentEvent?.title || 'Assigned Event';

  const profileHTML = `
    <div style="max-width:680px; margin:0 auto;">
      <div style="background:#ffffff; border-radius:24px; padding:32px 24px; border:1px solid #e2e8f0; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; gap:18px; margin-bottom:28px; flex-wrap:wrap;">
          <div style="width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; box-shadow:0 4px 14px rgba(99,102,241,0.35);">
            ${(user.fullName || 'A').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style="font-size:22px; font-weight:900; color:#0f172a; margin:0; line-height:1.2;">${user.fullName || 'Event Admin'}</h2>
            <div style="display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap;">
              <span style="background:#e0e7ff; color:#4338ca; font-size:11px; font-weight:800; padding:3px 10px; border-radius:12px; text-transform:uppercase;">Event Admin</span>
              <span style="background:#ecfdf5; color:#047857; font-size:11px; font-weight:800; padding:3px 10px; border-radius:12px;">📍 ${eventTitle}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; font-size:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px; flex-wrap:wrap; gap:8px;">
            <span style="color:#64748b; font-weight:600;">Email Address:</span>
            <strong style="color:#0f172a; font-weight:700;">${user.email || 'N/A'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px; flex-wrap:wrap; gap:8px;">
            <span style="color:#64748b; font-weight:600;">Username:</span>
            <strong style="color:#0f172a; font-weight:700;">${user.username || 'N/A'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px; flex-wrap:wrap; gap:8px;">
            <span style="color:#64748b; font-weight:600;">Assigned Event:</span>
            <strong style="color:#4338ca; font-weight:800;">${eventTitle}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px; flex-wrap:wrap; gap:8px;">
            <span style="color:#64748b; font-weight:600;">Account Status:</span>
            <span style="background:#d1fae5; color:#047857; border:1px solid #a7f3d0; font-size:12px; font-weight:800; padding:4px 12px; border-radius:20px;">Active</span>
          </div>
        </div>
      </div>
    </div>
  `;

  renderAdminPortalLayout('admin-profile', 'Admin Profile', profileHTML);
}

import { state } from '../app.js';
import { initMobileSidebarToggle, initHeaderBackButtons } from '../utils/helpers.js';

export function renderHeader(viewTitle, isDashboardView = false, topbarBtnText = '+ New Event') {
  initMobileSidebarToggle();
  initHeaderBackButtons();

  return `
    <header class="topbar" style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <button id="mobile-hamburger-btn" class="mobile-hamburger-btn" aria-label="Toggle Menu">☰</button>
        <button id="header-back-btn" class="header-back-btn" aria-label="Go Back" title="Go Back">←</button>
        ${isDashboardView ? `
          <div>
            <div style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:2px;">System Admin Dashboard</div>
            <div style="font-size:12px; color:#64748b;">Platform analytics and operational management tools.</div>
          </div>
        ` : `
          <div class="topbar-title" style="font-size:18px; font-weight:700; color:#0f172a;">${viewTitle}</div>
        `}
      </div>

      <div class="topbar-user" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <div class="topbar-search-box">
          <span style="color:#94a3b8; font-size:14px;">🔍</span>
          <input type="text" class="topbar-search-input" placeholder="Search...">
        </div>
        <button class="topbar-icon-btn" title="Notifications">🔔</button>
      </div>
    </header>
  `;
}



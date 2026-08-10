import { state } from '../app.js';
import { initMobileSidebarToggle, initHeaderBackButtons } from '../utils/helpers.js';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, formatTimeAgo } from '../services/notificationService.js';

export function initNotificationBell() {
  setTimeout(() => {
    const btn = document.getElementById('topbar-notification-btn');
    const dropdown = document.getElementById('notification-dropdown');
    const badge = document.getElementById('topbar-notification-badge');
    const list = document.getElementById('notification-list');
    const markAllBtn = document.getElementById('mark-all-read-btn');

    if (!btn || !dropdown) return;

    function renderList() {
      const items = getNotifications();
      const unreadCount = getUnreadCount();

      if (badge) {
        if (unreadCount > 0) {
          badge.style.display = 'flex';
          badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
          badge.style.display = 'none';
        }
      }

      if (!list) return;
      if (items.length === 0) {
        list.innerHTML = `
          <div style="padding:28px 16px; text-align:center; color:#94a3b8; font-size:13px;">
            <div style="font-size:24px; margin-bottom:6px;">🎉</div>
            No notifications
          </div>`;
        return;
      }

      list.innerHTML = items.map(item => {
        const timeStr = item.timestamp ? formatTimeAgo(item.timestamp) : (item.time || 'Just now');
        return `
          <div class="notification-item" data-id="${item.id}" style="padding:12px 16px; display:flex; gap:12px; align-items:flex-start; border-bottom:1px solid #f1f5f9; background:${item.read ? '#ffffff' : '#f0f9ff'}; cursor:pointer; transition:background 0.2s;">
            <div style="font-size:18px; flex-shrink:0; margin-top:1px;">${item.icon || '🔔'}</div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <span style="font-size:13px; font-weight:${item.read ? '600' : '700'}; color:${item.read ? '#334155' : '#0f172a'};">${item.title}</span>
                <span style="font-size:11px; color:#94a3b8; margin-left:6px; flex-shrink:0;">${timeStr}</span>
              </div>
              <div style="font-size:12px; color:#64748b; line-height:1.35; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.message}</div>
            </div>
            ${!item.read ? `<span style="width:8px; height:8px; background:#6366f1; border-radius:50%; flex-shrink:0; margin-top:5px; box-shadow:0 0 6px rgba(99,102,241,0.6);"></span>` : ''}
          </div>
        `;
      }).join('');

      list.querySelectorAll('.notification-item').forEach(el => {
        el.onclick = (e) => {
          e.stopPropagation();
          const id = el.getAttribute('data-id');
          markAsRead(id);
        };
      });
    }

    renderList();

    const handleUpdate = () => renderList();
    window.removeEventListener('app-notifications-updated', handleUpdate);
    window.addEventListener('app-notifications-updated', handleUpdate);

    btn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    };

    if (markAllBtn) {
      markAllBtn.onclick = (e) => {
        e.stopPropagation();
        markAllAsRead();
      };
    }

    const closeDropdown = (e) => {
      if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };
    document.removeEventListener('click', closeDropdown);
    document.addEventListener('click', closeDropdown);
  }, 50);
}

export function renderHeader(viewTitle, isDashboardView = false, topbarBtnText = '+ New Event') {
  initMobileSidebarToggle();
  initHeaderBackButtons();
  initNotificationBell();

  return `
    <header class="topbar" style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <button id="mobile-hamburger-btn" class="mobile-hamburger-btn" aria-label="Toggle Menu">☰</button>
        ${!isDashboardView ? `<button id="header-back-btn" class="header-back-btn" aria-label="Go Back" title="Go Back">←</button>` : ''}
        ${isDashboardView ? `
          <div>
            <div style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:2px;">System Admin Dashboard</div>
            <div style="font-size:12px; color:#64748b;">Platform analytics and operational management tools.</div>
          </div>
        ` : `
          <div class="topbar-title" style="font-size:18px; font-weight:700; color:#0f172a;">${viewTitle}</div>
        `}
      </div>

      <div class="topbar-user" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; position:relative;">
        <button id="topbar-notification-btn" class="topbar-icon-btn" title="Notifications" aria-label="Notifications" style="position:relative; cursor:pointer; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; width:38px; height:38px; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
          <span style="font-size:16px;">🔔</span>
          <span id="topbar-notification-badge" style="position:absolute; top:-4px; right:-4px; background:#ef4444; color:white; font-size:10px; font-weight:800; min-width:18px; height:18px; border-radius:10px; display:flex; align-items:center; justify-content:center; padding:0 4px; border:2px solid #ffffff; box-shadow:0 2px 5px rgba(239,68,68,0.4);">3</span>
        </button>

        <div id="notification-dropdown" class="notification-dropdown" style="display:none; position:absolute; top:46px; right:0; width:330px; max-width:90vw; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 12px 32px rgba(15,23,42,0.18); z-index:1000; overflow:hidden;">
          <div style="padding:14px 16px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; background:#f8fafc;">
            <div style="font-weight:700; font-size:14px; color:#0f172a; display:flex; align-items:center; gap:6px;">
              <span>🔔</span> System Notifications
            </div>
            <button id="mark-all-read-btn" style="background:none; border:none; color:#6366f1; font-size:12px; font-weight:600; cursor:pointer; padding:2px 6px; border-radius:4px; transition:background 0.2s;">Mark all as read</button>
          </div>
          <div id="notification-list" style="max-height:320px; overflow-y:auto; padding:4px 0;">
          </div>
          <div style="padding:10px 16px; border-top:1px solid #f1f5f9; background:#fafafa; text-align:center;">
            <span style="font-size:11px; color:#94a3b8; font-weight:600;">Event Admin Operational Feed</span>
          </div>
        </div>
      </div>
    </header>
  `;
}




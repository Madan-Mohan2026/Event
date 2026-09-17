import { getStatusBadgeConfig, getCategoryBadgeConfig, resolveImageUrl } from '../../utils/eventHelpers.js';
import { getEventStatus, getRegistrationStatus } from '../../utils/eventStatus.js';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';

export function renderEventCardHeader(event) {
  const statusConfig = getStatusBadgeConfig(event.status);
  const catConfig = getCategoryBadgeConfig(event.category);
  const rawBanner = event.bannerImage || event.bannerImageUrl || event.imagePath || '';
  const bannerImage = resolveImageUrl(rawBanner) || FALLBACK_BANNER;

  const currentEventStatus = getEventStatus(event);
  const currentRegStatus = getRegistrationStatus(event);

  let eventLifecycleBadgeHTML = '';
  if (currentEventStatus === 'upcoming') {
    eventLifecycleBadgeHTML = `<span style="background:#f3e8ff; color:#7e22ce; border:1px solid #d8b4fe; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; backdrop-filter:blur(4px);">UPCOMING</span>`;
  } else if (currentEventStatus === 'ongoing') {
    eventLifecycleBadgeHTML = `<span style="background:#dbeafe; color:#1d4ed8; border:1px solid #93c5fd; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; backdrop-filter:blur(4px);">ONGOING</span>`;
  } else {
    eventLifecycleBadgeHTML = `<span style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; backdrop-filter:blur(4px);">COMPLETED</span>`;
  }

  let regBadgeHTML = '';
  if (currentRegStatus.code === 'not_open') {
    regBadgeHTML = `<span style="background:#fffbeb; color:#b45309; border:1px solid #fde68a; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; backdrop-filter:blur(4px);">Not Yet Open</span>`;
  } else if (currentRegStatus.code === 'open') {
    regBadgeHTML = `<span style="background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; backdrop-filter:blur(4px);">Reg. Open</span>`;
  } else {
    regBadgeHTML = `<span style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; backdrop-filter:blur(4px);">Reg. Closed</span>`;
  }

  return `
    <div class="event-card-header-banner">
      <img src="${bannerImage}" alt="${event.title || 'Event'}" class="event-banner-img" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${FALLBACK_BANNER}';" />

      <!-- Status Badges Top-Left -->
      <div style="position:absolute; top:12px; left:12px; display:flex; flex-direction:column; gap:6px; z-index:10;">
        <div class="event-badge-status ${statusConfig.className}">
          <span class="status-dot-pulse"></span>
          <span>${statusConfig.label}</span>
        </div>
      </div>

      <!-- Computed Status Badges Top-Right -->
      <div style="position:absolute; top:12px; right:12px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; z-index:10;">
        <div class="event-badge-category" style="background:${catConfig.bg}; color:${catConfig.color}; border:1px solid ${catConfig.border}; margin-bottom:2px;">
          ${catConfig.label}
        </div>
        ${eventLifecycleBadgeHTML}
        ${regBadgeHTML}
      </div>
    </div>
  `;
}

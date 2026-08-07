import { getStatusBadgeConfig, getCategoryBadgeConfig, resolveImageUrl } from '../../utils/eventHelpers.js';

export function renderEventCardHeader(event) {
  const statusConfig = getStatusBadgeConfig(event.status);
  const catConfig = getCategoryBadgeConfig(event.category);
  const rawBanner = event.bannerImage || event.bannerImageUrl || event.imagePath || '';
  const bannerImage = resolveImageUrl(rawBanner);

  return `
    <div class="event-card-header-banner">
      ${bannerImage ? `
        <img src="${bannerImage}" alt="${event.title}" class="event-banner-img" loading="lazy" decoding="async" />
      ` : `
        <div class="event-banner-fallback">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      `}

      <!-- Status Badge Top-Left -->
      <div class="event-badge-status ${statusConfig.className}">
        <span class="status-dot-pulse"></span>
        <span>${statusConfig.label}</span>
      </div>

      <!-- Category Badge Top-Right -->
      <div class="event-badge-category" style="background:${catConfig.bg}; color:${catConfig.color}; border:1px solid ${catConfig.border};">
        ${catConfig.label}
      </div>
    </div>
  `;
}

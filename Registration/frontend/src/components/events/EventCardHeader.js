import { getStatusBadgeConfig, getCategoryBadgeConfig, resolveImageUrl } from '../../utils/eventHelpers.js';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';

export function renderEventCardHeader(event) {
  const statusConfig = getStatusBadgeConfig(event.status);
  const catConfig = getCategoryBadgeConfig(event.category);
  const rawBanner = event.bannerImage || event.bannerImageUrl || event.imagePath || '';
  const bannerImage = resolveImageUrl(rawBanner) || FALLBACK_BANNER;

  return `
    <div class="event-card-header-banner">
      <img src="${bannerImage}" alt="${event.title || 'Event'}" class="event-banner-img" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${FALLBACK_BANNER}';" />

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

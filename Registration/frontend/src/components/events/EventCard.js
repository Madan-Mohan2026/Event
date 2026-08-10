import { renderEventCardHeader } from './EventCardHeader.js';
import { renderEventCardStats } from './EventCardStats.js';
import { renderEventWarning } from './EventWarning.js';
import { renderAssignFormDropdown } from './AssignFormDropdown.js';
import { renderEventCardActions } from './EventCardActions.js';
import { formatEventDate, truncateDescription } from '../../utils/eventHelpers.js';

export function renderEventCard(event, availableForms = [], assignedFormMap = new Map(), assignedFormIdsSet = new Set()) {
  if (!event) return '';
  const isPublished = event.status === 'published';
  const hasFormAssigned = Boolean(event.assignedFormId && String(event.assignedFormId).trim() !== '');
  const dateFormatted = formatEventDate(event.date);
  const descShort = truncateDescription(event.description, 100);
  const eventId = event._id || '';
  const title = event.title || 'Untitled Event';

  return `
    <div class="event-card-container" data-event-id="${eventId}">
      <!-- Top Banner with Overlay Badges -->
      ${renderEventCardHeader(event)}

      <!-- Card Body -->
      <div class="event-card-content">
        <!-- Title -->
        <h3 class="event-card-title-text" title="${title}">${title}</h3>

        <!-- Date Row -->
        <div class="event-card-date-line">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${dateFormatted}</span>
        </div>

        <!-- Description -->
        <p class="event-card-desc-text" title="${event.description || ''}">${descShort}</p>

        <!-- Assign Form Dropdown component -->
        ${renderAssignFormDropdown(event, availableForms, assignedFormMap, assignedFormIdsSet)}

        <!-- 4 Stats Pill Row -->
        ${renderEventCardStats(event)}

        <!-- Card Action Buttons -->
        ${renderEventCardActions(event, hasFormAssigned)}
      </div>
    </div>
  `;
}

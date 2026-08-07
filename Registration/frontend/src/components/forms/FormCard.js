import { formatCreatedDate } from '../../utils/formHelpers.js';
import { resolveImageUrl } from '../../utils/eventHelpers.js';

export function renderFormCard(event) {
  const fieldsCount = Array.isArray(event.formSchema) ? event.formSchema.length : (event.formSchema ? 3 : 0);
  const responsesCount = event.regsCount !== undefined ? event.regsCount : (event.responsesCount || 0);
  const createdDateFormatted = formatCreatedDate(event.createdAt || event.date);
  const isAssigned = !!event.assignedFormId || (fieldsCount > 0);
  const bannerImage = resolveImageUrl(event.bannerImage);

  return `
    <div class="form-card-container" data-event-id="${event._id}">
      <!-- Top Banner Image -->
      <div class="form-card-banner">
        ${bannerImage ? `
          <img src="${bannerImage}" alt="${event.title}" class="form-banner-img" />
        ` : `
          <div class="form-banner-fallback">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
        `}

        <!-- Assigned / Unassigned Badge Overlay Top-Left -->
        <div class="form-card-badge ${isAssigned ? 'badge-assigned' : 'badge-unassigned'}">
          ${isAssigned ? '✓ Assigned' : 'Unassigned'}
        </div>
      </div>

      <!-- Card Content -->
      <div class="form-card-content">
        <h3 class="form-card-title" title="${event.title}">${event.title}</h3>
        <p class="form-card-desc" title="${event.description || ''}">${event.description || 'No description provided.'}</p>

        <!-- 3 Stats Columns (FIELDS | RESPONSES | CREATED) -->
        <div class="form-card-stats-row">
          <div class="form-stat-col">
            <span class="stat-val">${fieldsCount}</span>
            <span class="stat-lbl">FIELDS</span>
          </div>
          <div class="form-stat-col">
            <span class="stat-val">${responsesCount}</span>
            <span class="stat-lbl">RESPONSES</span>
          </div>
          <div class="form-stat-col">
            <span class="stat-val">${createdDateFormatted}</span>
            <span class="stat-lbl">CREATED</span>
          </div>
        </div>

        <!-- Card Action Buttons -->
        <div class="form-card-actions">
          <button type="button" class="btn-form-action btn-form-view view-form-btn" data-id="${event._id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>View</span>
          </button>

          <button type="button" class="btn-form-action btn-form-edit edit-form-btn" data-id="${event._id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit</span>
          </button>

          <button type="button" class="btn-form-icon-delete delete-form-btn" data-id="${event._id}" title="Delete Form">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

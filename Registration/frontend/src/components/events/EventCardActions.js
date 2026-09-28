export function renderEventCardActions(event, hasFormAssigned) {
  const isPublished = event.status === 'published';

  return `
    <div class="event-card-actions-wrapper">
      <!-- Main Action Row (Preview Form + Publish/Unpublish) -->
      <div class="actions-primary-row">
        <button type="button" class="btn-event-action preview-event-btn ${!hasFormAssigned ? 'btn-disabled-preview' : ''}" data-id="${event._id}" ${!hasFormAssigned ? 'disabled' : ''} title="${hasFormAssigned ? 'Preview assigned form' : 'Assign Form before previewing'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>Preview Form</span>
        </button>

        ${isPublished ? `
          <button type="button" class="btn-event-action unpublish-event-btn toggle-status-btn" data-id="${event._id}" data-status="draft" title="Unpublish event">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            <span>Unpublish</span>
          </button>
        ` : `
          <button type="button" class="btn-event-action publish-event-btn toggle-status-btn ${!hasFormAssigned ? 'btn-disabled-publish' : ''}" data-id="${event._id}" data-status="published" ${!hasFormAssigned ? 'disabled' : ''} title="${hasFormAssigned ? 'Publish event' : 'Assign Form before publishing'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span>Publish</span>
          </button>
        `}
      </div>

      <!-- Secondary Utility Bar -->
      <div class="actions-utility-bar">
        <button type="button" class="btn-util-action copy-link-btn ${!isPublished ? 'util-disabled' : ''}" data-id="${event._id}" ${!isPublished ? 'disabled' : ''} title="${isPublished ? 'Copy Public Registration Link' : 'Publish event to enable link'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy Link</span>
        </button>

        <button type="button" class="btn-util-action qr-event-btn view-checkin-qr-btn ${!isPublished ? 'util-disabled' : ''}" data-id="${event._id}" ${!isPublished ? 'disabled' : ''} title="${isPublished ? 'View Check-in QR Code' : 'Publish event to enable QR'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>QR</span>
        </button>

        <button type="button" class="btn-util-action edit-event-btn" data-id="${event._id}" title="Edit Event Details">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit</span>
        </button>

        <button type="button" class="btn-util-action btn-util-delete delete-event-btn" data-id="${event._id}" title="Delete Event">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <span>Delete</span>
        </button>
      </div>
    </div>
  `;
}

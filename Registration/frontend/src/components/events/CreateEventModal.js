import { renderEventBasicInfoForm } from './EventBasicInfoForm.js';
import { renderEventClassificationForm } from './EventClassificationForm.js';
import { renderEventDateTimeForm } from './EventDateTimeForm.js';
import { renderEventVenueForm } from './EventVenueForm.js';
import { renderEventAdminMediaForm } from './EventAdminMediaForm.js';
import { createEvent, updateEvent } from '../../services/eventService.js';
import { notifyEventCreated, notifyEventUpdated } from '../../services/notificationService.js';
import { showAlert } from '../../utils/helpers.js';

export function openCreateEventModal(eventObj = null, onSuccessCallback = null) {
  const isEdit = !!eventObj;

  let modalHolder = document.getElementById('modal-holder');
  if (!modalHolder) {
    modalHolder = document.createElement('div');
    modalHolder.id = 'modal-holder';
    document.body.appendChild(modalHolder);
  }

  modalHolder.innerHTML = `
    <div class="create-event-modal-overlay" id="create-event-modal-overlay">
      <div class="create-event-modal-container">
        <!-- Header -->
        <div class="create-event-modal-header">
          <div class="modal-header-left">
            <span class="modal-breadcrumb">EVENTS &gt; ${isEdit ? 'EDIT EVENT' : 'CREATE EVENT'}</span>
            <h2 class="create-event-modal-title">${isEdit ? 'Edit Event' : 'Create New Event'}</h2>
          </div>
          <button type="button" class="btn-back-to-events" id="modal-back-btn">
            ← Back to Events
          </button>
        </div>

        <!-- Body Form (5 Sections) -->
        <div class="create-event-modal-body">
          <form id="create-event-modal-form">
            <!-- Section 1: Basic Information -->
            ${renderEventBasicInfoForm(isEdit, eventObj)}

            <!-- Section 2: Classification & Participant Selection -->
            ${renderEventClassificationForm(isEdit, eventObj)}

            <!-- Section 3: Date & Time -->
            ${renderEventDateTimeForm(isEdit, eventObj)}

            <!-- Section 4: Venue & Location -->
            ${renderEventVenueForm(isEdit, eventObj)}

            <!-- Section 5: Administration & Media -->
            ${renderEventAdminMediaForm(isEdit, eventObj)}

            <!-- Hidden Submit for Form Handler -->
            <button type="submit" id="hidden-submit-btn" style="display:none;"></button>
          </form>
        </div>

        <!-- Footer -->
        <div class="create-event-modal-footer">
          <button type="button" class="btn-modal-cancel" id="modal-cancel-btn">Cancel</button>
          <button type="button" class="btn-modal-submit" id="modal-submit-btn">${isEdit ? 'Save Changes' : 'Create Event'}</button>
        </div>
      </div>
    </div>
  `;

  document.body.style.overflow = 'hidden';

  const closeModal = () => {
    document.body.style.overflow = '';
    modalHolder.innerHTML = '';
    document.removeEventListener('keydown', escapeHandler);
  };

  const escapeHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  document.addEventListener('keydown', escapeHandler);
  document.getElementById('modal-back-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);

  document.getElementById('create-event-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  let bannerImageDataUrl = isEdit ? (eventObj.bannerImage || eventObj.bannerImageUrl || eventObj.imagePath || '') : '';
  let agendaPdfDataUrl = isEdit ? (eventObj.agendaPdf || '') : '';

  // Show existing filename if editing an event
  if (isEdit && bannerImageDataUrl) {
    const bannerLabel = document.getElementById('banner-file-name');
    if (bannerLabel) {
      const fileName = bannerImageDataUrl.startsWith('data:') ? 'Image selected' : bannerImageDataUrl.split('/').pop();
      bannerLabel.textContent = `Current: ${fileName}`;
    }
  }
  if (isEdit && agendaPdfDataUrl) {
    const agendaLabel = document.getElementById('agenda-file-name');
    if (agendaLabel) {
      const fileName = agendaPdfDataUrl.startsWith('data:') ? 'PDF selected' : agendaPdfDataUrl.split('/').pop();
      agendaLabel.textContent = `Current: ${fileName}`;
    }
  }

  // Handle Banner file input display name & Base64 reader
  document.getElementById('ev-banner-file')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    const labelEl = document.getElementById('banner-file-name');
    if (file) {
      if (labelEl) labelEl.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (evt) => { bannerImageDataUrl = evt.target.result; };
      reader.readAsDataURL(file);
    } else if (labelEl && !isEdit) {
      labelEl.textContent = 'No file chosen';
    }
  });

  // Handle Agenda file input display name & Base64 reader
  document.getElementById('ev-agenda-file')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    const labelEl = document.getElementById('agenda-file-name');
    if (file) {
      if (labelEl) labelEl.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (evt) => { agendaPdfDataUrl = evt.target.result; };
      reader.readAsDataURL(file);
    } else if (labelEl && !isEdit) {
      labelEl.textContent = 'No file chosen';
    }
  });

  // Submit Handler
  document.getElementById('modal-submit-btn')?.addEventListener('click', () => {
    const form = document.getElementById('create-event-modal-form');
    if (form) form.requestSubmit();
  });

  document.getElementById('create-event-modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const regStartDateTime = document.getElementById('ev-reg-start-datetime')?.value || '';
    const regEndDateTime = document.getElementById('ev-reg-end-datetime')?.value || '';

    if (regStartDateTime && regEndDateTime) {
      const startObj = new Date(regStartDateTime);
      const endObj = new Date(regEndDateTime);
      if (startObj > endObj) {
        showAlert('Registration Start Date & Time cannot be later than Registration End Date & Time.', 'error');
        return;
      }
    }

    let registrationStart = '';
    let registrationStartTime = '';
    if (regStartDateTime) {
      const parts = regStartDateTime.split('T');
      registrationStart = parts[0] || '';
      registrationStartTime = parts[1] || '';
    }

    let registrationEnd = '';
    let registrationEndTime = '';
    if (regEndDateTime) {
      const parts = regEndDateTime.split('T');
      registrationEnd = parts[0] || '';
      registrationEndTime = parts[1] || '';
    }

    const payload = {
      title: document.getElementById('ev-title').value.trim(),
      summary: document.getElementById('ev-summary')?.value.trim() || '',
      description: document.getElementById('ev-desc').value.trim(),
      category: document.getElementById('ev-category')?.value || 'Startups',
      teamWide: document.getElementById('ev-teamwide')?.value || 'Innotribes',
      organizerTeam: document.getElementById('ev-organizer-team')?.value || 'All Teams',
      eventType: document.getElementById('ev-event-type')?.value || 'All Event Types',
      organizerName: document.getElementById('ev-organizer-team')?.value || '',
      capacity: parseInt(document.getElementById('ev-capacity')?.value, 10) || 500,
      date: document.getElementById('ev-date')?.value || '',
      time: document.getElementById('ev-time')?.value || '',
      endDate: document.getElementById('ev-enddate')?.value || '',
      endTime: document.getElementById('ev-endtime')?.value || '',
      registrationStart,
      registrationStartTime,
      registrationDeadline: registrationEnd,
      registrationEnd,
      registrationEndTime,
      timezone: document.getElementById('ev-timezone')?.value || 'Asia/Calcutta',
      location: document.getElementById('ev-location')?.value.trim() || '',
      speakerDetails: document.getElementById('ev-speaker')?.value.trim() || '',
      assignedAdmin: document.getElementById('ev-assigned-admin')?.value || 'unassigned',
      contactNumber: document.getElementById('ev-contact')?.value.trim() || '',
      supportEmail: document.getElementById('ev-email')?.value.trim() || '',
      bannerImage: bannerImageDataUrl,
      agendaPdf: agendaPdfDataUrl,
      status: isEdit ? eventObj.status : 'draft'
    };

    try {
      if (isEdit) {
        await updateEvent(eventObj._id, payload);
        notifyEventUpdated(payload.title);
        showAlert(`Event "${payload.title}" updated successfully!`, 'success');
      } else {
        await createEvent(payload);
        notifyEventCreated(payload.title);
        showAlert(`Event "${payload.title}" created successfully!`, 'success');
      }
      closeModal();
      if (typeof onSuccessCallback === 'function') {
        onSuccessCallback();
      }
    } catch (err) {
      alert('Failed to save event: ' + err.message);
    }
  });
}

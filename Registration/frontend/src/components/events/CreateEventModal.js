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

  // Handle Participant Type multi-select checkboxes
  const ptCheckboxes = document.querySelectorAll('.ev-pt-checkbox');
  const syncParticipantTypeInput = () => {
    const checked = Array.from(document.querySelectorAll('.ev-pt-checkbox:checked')).map(cb => cb.value);
    const catInput = document.getElementById('ev-category');
    if (catInput) {
      catInput.value = checked.length > 0 ? checked.join(', ') : 'Startups';
    }
    ptCheckboxes.forEach(cb => {
      const label = cb.closest('.pt-chip');
      if (label) {
        if (cb.checked) {
          label.style.border = '1.5px solid #4f46e5';
          label.style.background = '#eef2ff';
          label.style.color = '#4338ca';
        } else {
          label.style.border = '1.5px solid #e2e8f0';
          label.style.background = '#f8fafc';
          label.style.color = '#475569';
        }
      }
    });
  };

  ptCheckboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.value === 'All' && e.target.checked) {
        ptCheckboxes.forEach(c => { c.checked = true; });
      } else if (e.target.value === 'All' && !e.target.checked) {
        ptCheckboxes.forEach(c => { c.checked = (c.value === 'Startups'); });
      }
      syncParticipantTypeInput();
    });
  });

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

    // Ensure file inputs are fully read if user selected a file
    const bannerFileInput = document.getElementById('ev-banner-file');
    if (bannerFileInput && bannerFileInput.files && bannerFileInput.files[0] && !bannerImageDataUrl.startsWith('data:')) {
      bannerImageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target?.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(bannerFileInput.files[0]);
      });
    }

    const agendaFileInput = document.getElementById('ev-agenda-file');
    if (agendaFileInput && agendaFileInput.files && agendaFileInput.files[0] && !agendaPdfDataUrl.startsWith('data:')) {
      agendaPdfDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target?.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(agendaFileInput.files[0]);
      });
    }

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

    const selectedCategoryVal = Array.from(document.querySelectorAll('.ev-pt-checkbox:checked')).map(el => el.value).join(', ') || document.getElementById('ev-category')?.value || 'Startups';

    const payload = {
      title: document.getElementById('ev-title').value.trim(),
      summary: document.getElementById('ev-summary')?.value.trim() || '',
      description: document.getElementById('ev-desc').value.trim(),
      category: selectedCategoryVal,
      participantType: selectedCategoryVal,
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

import { state, navigate } from '../app.js';
import { getEventById, createEvent, updateEvent } from '../services/eventService.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { notifyEventCreated, notifyEventUpdated } from '../services/notificationService.js';
import { showAlert } from '../utils/helpers.js';
import { renderEventBasicInfoForm } from '../components/events/EventBasicInfoForm.js';
import { renderEventClassificationForm } from '../components/events/EventClassificationForm.js';
import { renderEventDateTimeForm } from '../components/events/EventDateTimeForm.js';
import { renderEventVenueForm } from '../components/events/EventVenueForm.js';
import { renderEventAdminMediaForm } from '../components/events/EventAdminMediaForm.js';

export async function renderCreateEventPage(state, eventId = null) {
  const app = document.getElementById('app');
  if (!app) return;

  // Restore overflow style in case it was locked previously
  document.body.style.overflow = '';

  let eventObj = null;
  if (eventId) {
    eventObj = state.events?.find(e => String(e._id) === String(eventId)) || null;
    if (!eventObj) {
      try {
        eventObj = await getEventById(eventId);
      } catch (err) {
        showAlert('Failed to load event details for editing.', 'danger');
      }
    }
  }

  const isEdit = !!eventObj;
  const pageTitle = isEdit ? 'Edit Event' : 'Create New Event';
  const breadcrumbText = isEdit ? 'EVENTS > EDIT EVENT' : 'EVENTS > CREATE EVENT';

  const contentHTML = `
    <div class="create-event-page-container" style="max-width: 1000px; margin: 0 auto; padding-bottom: 40px;">
      <!-- Page Top Header -->
      <div class="create-event-page-header" style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div class="header-left" style="display:flex; flex-direction:column; gap:4px;">
          <span class="create-event-breadcrumb" style="font-size:11px; font-weight:800; color:#64748b; letter-spacing:0.8px; text-transform:uppercase;">${breadcrumbText}</span>
          <h2 class="create-event-page-title" style="font-size:24px; font-weight:800; color:#0f172a; margin:0;">${pageTitle}</h2>
        </div>
        <button type="button" class="btn-back-to-events" id="page-back-to-events-btn">
          ← Back to Events
        </button>
      </div>

      <!-- Main Body Form Area (Occupies natural page width, full page scrolling) -->
      <form id="create-event-page-form">
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

        <!-- Page Action Footer -->
        <div class="create-event-page-footer" style="margin-top:24px; padding:20px 24px; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; display:flex; align-items:center; justify-content:flex-end; gap:14px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
          <button type="button" class="btn-modal-cancel" id="page-cancel-btn">Cancel</button>
          <button type="submit" class="btn-modal-submit" id="page-submit-btn">${isEdit ? 'Save Changes' : 'Create Event'}</button>
        </div>
      </form>
    </div>
  `;

  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar('events', state.user)}
      <div class="main-wrapper">
        ${renderHeader(pageTitle, false)}
        <main class="content-body">${contentHTML}</main>
      </div>
    </div>
  `;

  // Attach navigation event handlers
  document.getElementById('page-back-to-events-btn')?.addEventListener('click', () => {
    navigate('#events');
  });

  document.getElementById('page-cancel-btn')?.addEventListener('click', () => {
    navigate('#events');
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
  document.getElementById('create-event-page-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

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
      navigate('#events');
    } catch (err) {
      showAlert('Failed to save event: ' + err.message, 'danger');
    }
  });
}

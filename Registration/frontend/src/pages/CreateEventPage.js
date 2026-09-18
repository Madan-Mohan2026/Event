import { state, navigate } from '../app.js';
import { getEventById, createEvent, updateEvent } from '../services/eventService.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { notifyEventCreated, notifyEventUpdated } from '../services/notificationService.js';
import { showAlert } from '../utils/helpers.js';
import { resolveImageUrl } from '../utils/eventHelpers.js';
import { renderEventBasicInfoForm } from '../components/events/EventBasicInfoForm.js';
import { renderEventClassificationForm } from '../components/events/EventClassificationForm.js';
import { renderEventDateTimeForm } from '../components/events/EventDateTimeForm.js';
import { renderEventVenueForm } from '../components/events/EventVenueForm.js';
import { renderEventAdminMediaForm } from '../components/events/EventAdminMediaForm.js';

export async function renderCreateEventPage(state, eventId = null) {
  const app = document.getElementById('app');
  if (!app) return;

  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';

  let eventObj = null;
  if (eventId) {
    try {
      eventObj = await getEventById(eventId);
    } catch (err) {
      eventObj = state.events?.find(e => String(e._id) === String(eventId)) || null;
      if (!eventObj) {
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

  // Helper to update banner preview UI safely
  const updateBannerPreviewUI = (dataUrl, file = null) => {
    console.log('[DEBUG ATOMIC STEP 5.0]: Starting updateBannerPreviewUI. dataUrl length:', dataUrl ? dataUrl.length : 0);
    try {
      console.log('[DEBUG ATOMIC STEP 5.1]: Querying banner-file-name element...');
      const labelEl = document.getElementById('banner-file-name');
      console.log('[DEBUG ATOMIC STEP 5.2]: Querying banner-preview-container element...');
      const previewContainer = document.getElementById('banner-preview-container');
      console.log('[DEBUG ATOMIC STEP 5.3]: Querying banner-preview-img element...');
      const previewImg = document.getElementById('banner-preview-img');
      console.log('[DEBUG ATOMIC STEP 5.4]: Querying banner-preview-info element...');
      const previewInfo = document.getElementById('banner-preview-info');

      if (dataUrl) {
        console.log('[DEBUG ATOMIC STEP 5.5]: Updating labelEl text...');
        if (labelEl) labelEl.textContent = file ? file.name : (dataUrl.startsWith('data:') ? 'New image selected' : 'Current banner loaded');

        console.log('[DEBUG ATOMIC STEP 5.6]: Showing previewContainer...');
        if (previewContainer) previewContainer.style.display = 'block';

        console.log('[DEBUG ATOMIC STEP 5.7]: Resolving image URL...');
        let resolvedSrc = '';
        try {
          resolvedSrc = resolveImageUrl(dataUrl) || dataUrl;
          console.log('[DEBUG ATOMIC STEP 5.8]: Resolved URL length:', resolvedSrc ? resolvedSrc.length : 0);
        } catch (resErr) {
          console.error('[DEBUG ATOMIC STEP 5.8 ERROR]: resolveImageUrl failed:', resErr);
          resolvedSrc = dataUrl;
        }

        if (previewImg) {
          console.log('[DEBUG ATOMIC STEP 5.9]: Setting previewImg.style.display to block...');
          previewImg.style.display = 'block';
          console.log('[DEBUG ATOMIC STEP 5.10]: Assigning previewImg.src...');
          previewImg.src = resolvedSrc;
          console.log('[DEBUG ATOMIC STEP 5.11]: previewImg.src assigned successfully!');
        } else {
          console.warn('[DEBUG ATOMIC STEP 5.9 WARN]: previewImg element NOT found in DOM!');
        }

        if (previewInfo) {
          console.log('[DEBUG ATOMIC STEP 5.12]: Setting previewInfo text...');
          previewInfo.textContent = file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Current event banner image';
        }
      } else {
        if (labelEl) labelEl.textContent = 'No file chosen';
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) {
          previewImg.style.display = 'none';
          previewImg.src = '';
        }
        if (previewInfo) previewInfo.textContent = '';
      }
      console.log('[DEBUG ATOMIC STEP 5.13]: updateBannerPreviewUI complete!');
    } catch (err) {
      console.error('❌ [DEBUG ATOMIC ERROR in updateBannerPreviewUI]:', err.stack || err.message || err);
    }
  };

  // Initialize preview state on render if existing banner exists
  if (bannerImageDataUrl) {
    updateBannerPreviewUI(bannerImageDataUrl);
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

// Helper to resize and compress selected banner images to ~150KB JPEG
function compressImage(file, maxWidth = 1200, maxHeight = 675, quality = 0.85) {
  return new Promise((resolve, reject) => {
    console.log('[DEBUG BANNER COMPRESS]: Starting FileReader for image compression...');
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('[DEBUG BANNER COMPRESS]: FileReader loaded. Result length:', e.target.result?.length);
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          console.log('[DEBUG BANNER COMPRESS]: Image loaded in memory. Original size:', width, 'x', height);

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          console.log('[DEBUG BANNER COMPRESS]: Canvas compression complete. Compressed length:', dataUrl?.length);
          resolve(dataUrl);
        } catch (err) {
          console.error('❌ [DEBUG BANNER COMPRESS ERROR]: Canvas error fallback to raw data URL:', err);
          resolve(e.target.result); // Fallback to raw data URL if canvas fails
        }
      };
      img.onerror = (err) => {
        console.error('❌ [DEBUG BANNER COMPRESS ERROR]: Image element error fallback:', err);
        resolve(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => {
      console.error('❌ [DEBUG BANNER COMPRESS ERROR]: FileReader error:', err);
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

  // Button triggers for file pickers (avoids HTML label double-click issues)
  document.getElementById('btn-trigger-banner-file')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('ev-banner-file')?.click();
  });

  document.getElementById('btn-trigger-agenda-file')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('ev-agenda-file')?.click();
  });

  // Handle Banner file input display name, validation, live preview & Base64 reader
  document.getElementById('ev-banner-file')?.addEventListener('change', async (e) => {
    console.log('📌 [DEBUG BANNER STEP 1]: ev-banner-file change event triggered!', e);
    e.stopPropagation();
    try {
      const bannerInput = e.target;
      const file = bannerInput.files && bannerInput.files[0];

      console.log('📌 [DEBUG BANNER STEP 2]: File object:', file ? { name: file.name, type: file.type, size: file.size } : null);

      if (!file) {
        console.log('📌 [DEBUG BANNER STEP 2.1]: No file selected');
        if (!bannerImageDataUrl) {
          updateBannerPreviewUI('');
        }
        return;
      }

      // 1. File Type Validation (Must be an image)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
      if (!file.type || (!file.type.startsWith('image/') && !allowedTypes.includes(file.type.toLowerCase()))) {
        console.warn('⚠️ [DEBUG BANNER STEP 2.2]: Invalid file type:', file.type);
        showAlert('Invalid file type! Please select an image file (JPEG, PNG, WEBP, GIF).', 'error');
        bannerInput.value = '';
        return;
      }

      // 2. File Size Validation (Max 10MB input limit before compression)
      const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        console.warn('⚠️ [DEBUG BANNER STEP 2.3]: File size exceeds 10MB:', file.size);
        showAlert(`Selected image (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds max limit of 10 MB. Please choose a smaller image.`, 'error');
        bannerInput.value = '';
        return;
      }

      console.log('📌 [DEBUG BANNER STEP 3]: Compressing image...');
      // 3. Compress image for high performance & instant preview
      const compressedDataUrl = await compressImage(file).catch((err) => {
        console.error('❌ [DEBUG BANNER STEP 3 ERROR]: compressImage failed:', err);
        return null;
      });

      console.log('📌 [DEBUG BANNER STEP 4]: Compression result present:', !!compressedDataUrl, 'Length:', compressedDataUrl?.length);

      if (!compressedDataUrl) {
        showAlert('Failed to process selected image file.', 'error');
        bannerInput.value = '';
        return;
      }

      bannerImageDataUrl = compressedDataUrl;
      console.log('📌 [DEBUG BANNER STEP 4.5]: Updating preview UI with bannerImageDataUrl...');
      updateBannerPreviewUI(bannerImageDataUrl, file);
    } catch (changeErr) {
      console.error('❌ [DEBUG BANNER STEP CATCH ERROR]: Unexpected error in banner change handler:', changeErr.stack || changeErr.message || changeErr);
      showAlert('An error occurred while selecting banner image.', 'error');
    }
  });

  // Handle Banner Removal button
  document.getElementById('banner-remove-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      bannerImageDataUrl = '';
      const bannerFileInput = document.getElementById('ev-banner-file');
      if (bannerFileInput) bannerFileInput.value = '';
      updateBannerPreviewUI('');
      showAlert('Banner image removed.', 'info');
    } catch (err) {
      console.error('[CreateEventPage]: Error removing banner image:', err);
    }
  });

  // Handle Agenda file input display name & Base64 reader
  document.getElementById('ev-agenda-file')?.addEventListener('change', (e) => {
    try {
      const file = e.target.files && e.target.files[0];
      const labelEl = document.getElementById('agenda-file-name');
      if (file) {
        if (file.type !== 'application/pdf') {
          showAlert('Invalid file type! Agenda must be a PDF file.', 'error');
          e.target.value = '';
          return;
        }
        if (labelEl) labelEl.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => { agendaPdfDataUrl = evt.target.result; };
        reader.readAsDataURL(file);
      } else if (labelEl && !isEdit) {
        labelEl.textContent = 'No file chosen';
      }
    } catch (err) {
      console.error('[CreateEventPage]: Error handling agenda file change:', err);
    }
  });

  // Submit Handler
  document.getElementById('create-event-page-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
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

      const titleVal = document.getElementById('ev-title')?.value.trim() || '';
      const summaryVal = document.getElementById('ev-summary')?.value.trim() || '';
      const descVal = document.getElementById('ev-desc')?.value.trim() || '';

      if (!titleVal) {
        showAlert('Event Title is required.', 'danger');
        document.getElementById('ev-title')?.focus();
        return;
      }
      if (!summaryVal) {
        showAlert('Event Summary is required.', 'danger');
        document.getElementById('ev-summary')?.focus();
        return;
      }
      if (!descVal) {
        showAlert('Event Description is required.', 'danger');
        document.getElementById('ev-desc')?.focus();
        return;
      }

      const payload = {
        title: titleVal,
        summary: summaryVal,
        description: descVal,
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
      console.error('[CreateEventPage]: Error submitting event form:', err);
      showAlert('Failed to save event: ' + (err.message || 'Unknown error'), 'danger');
    }
  });
}


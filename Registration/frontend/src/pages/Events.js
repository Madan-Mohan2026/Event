import { state, navigate } from '../app.js';
import { getEvents, getEventById, updateEvent, deleteEvent } from '../services/eventService.js';
import { fetchAllForms } from '../services/formService.js';
import { apiFetch } from '../services/api.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { showAlert, copyToClipboard } from '../utils/helpers.js';
import { notifyEventDeleted } from '../services/notificationService.js';
import { renderEventCard } from '../components/events/EventCard.js';
import { openCreateEventModal } from '../components/events/CreateEventModal.js';
import { copyEventLink } from '../utils/eventHelpers.js';
import { getPublicBaseUrl, buildQrUrl } from '../utils/qrHelpers.js';

export async function renderEvents() {
  return renderEventsList();
}

export async function renderEventsList() {
  try {
    const [rawEvents, rawForms] = await Promise.all([
      getEvents(),
      fetchAllForms().catch(() => [])
    ]);

    const events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);
    state.events = events;

    const availableForms = Array.isArray(rawForms) ? rawForms : (rawForms.forms || []);

    const assignedFormMap = new Map();
    availableForms.forEach(f => {
      if (f._id) assignedFormMap.set(String(f._id), f);
    });

    const assignedFormIdsSet = new Set(events.map(ev => String(ev.assignedFormId || '').trim()).filter(Boolean));

    const cardsHTML = events.length > 0
      ? events.map(ev => renderEventCard(ev, availableForms, assignedFormMap, assignedFormIdsSet)).join('')
      : `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 18px; border: 1px solid #e2e8f0; color: #64748b;">
          <p style="font-size:18px; font-weight:700; margin-bottom:8px; color:#0f172a;">No events created yet.</p>
          <p style="font-size:14px; margin-bottom:20px;">Click <strong>+ New Event</strong> in the header to create your first event.</p>
          <button class="btn btn-primary" id="empty-state-new-event-btn">+ New Event</button>
        </div>
      `;

    const html = `
      <!-- Reusable Confirmation Modal -->
      <div id="ev-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.5); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:white; border-radius:20px; padding:36px; max-width:440px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.25); position:relative;">
          <div id="ev-modal-icon" style="font-size:40px; text-align:center; margin-bottom:16px;"></div>
          <h3 id="ev-modal-title" style="font-size:20px; font-weight:800; color:#0f172a; text-align:center; margin-bottom:10px;"></h3>
          <p id="ev-modal-body" style="font-size:14px; color:#64748b; text-align:center; line-height:1.6; margin-bottom:28px;"></p>
          <div style="display:flex; gap:12px; justify-content:center;">
            <button id="ev-modal-cancel" style="padding:11px 28px; border-radius:10px; border:1.5px solid #e2e8f0; background:white; font-size:14px; font-weight:600; color:#64748b; cursor:pointer;">Cancel</button>
            <button id="ev-modal-confirm" style="padding:11px 28px; border-radius:10px; border:none; font-size:14px; font-weight:700; color:white; cursor:pointer; min-width:120px;"></button>
          </div>
        </div>
      </div>

      <!-- Events Page Header & Create Button -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin:0;">All Events</h2>
          <p style="font-size:13px; color:#64748b; margin:2px 0 0;">Manage events, registration forms, assignments, and check-in workflows.</p>
        </div>
        <button id="page-create-event-btn" class="btn btn-primary" style="background:linear-gradient(135deg,#6366f1,#4f46e5); border:none; padding:10px 20px; border-radius:10px; font-weight:700; font-size:14px; box-shadow:0 4px 14px rgba(99,102,241,0.35); cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
          <span>➕</span> Create Event
        </button>
      </div>

      <!-- Redesigned Modern Cards Grid -->
      <div class="events-cards-grid">
        ${cardsHTML}
      </div>
    `;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('events', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Events Management', false, '+ Create Event')}
          <main class="content-body">${html}</main>
        </div>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('#login');
    });

    // Create Event button handlers
    const openCreateModal = () => openCreateEventModal(null, renderEventsList);
    document.getElementById('topbar-new-event-btn')?.addEventListener('click', openCreateModal);
    document.getElementById('page-create-event-btn')?.addEventListener('click', openCreateModal);
    document.getElementById('empty-state-new-event-btn')?.addEventListener('click', openCreateModal);

    if (window.location.hash === '#create-event') {
      setTimeout(openCreateModal, 100);
    }

    // Helper: Confirmation Modal
    function showConfirmModal({ icon, title, body, confirmLabel, confirmColor }) {
      return new Promise((resolve) => {
        const overlay = document.getElementById('ev-modal-overlay');
        document.getElementById('ev-modal-icon').textContent = icon || '❓';
        document.getElementById('ev-modal-title').textContent = title || 'Confirm Action';
        document.getElementById('ev-modal-body').textContent = body || '';
        const confirmBtn = document.getElementById('ev-modal-confirm');
        confirmBtn.textContent = confirmLabel || 'Confirm';
        confirmBtn.style.background = confirmColor || '#4f46e5';
        overlay.style.display = 'flex';

        function close(result) {
          overlay.style.display = 'none';
          confirmBtn.removeEventListener('click', onConfirm);
          document.getElementById('ev-modal-cancel').removeEventListener('click', onCancel);
          overlay.removeEventListener('click', onOverlay);
          resolve(result);
        }
        function onConfirm() { close(true); }
        function onCancel() { close(false); }
        function onOverlay(e) { if (e.target === overlay) close(false); }

        confirmBtn.addEventListener('click', onConfirm);
        document.getElementById('ev-modal-cancel').addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
      });
    }

    // Bind Assign Form Submit Button
    document.querySelectorAll('.btn-assign-form-submit').forEach(btn => {
      btn.addEventListener('click', async function() {
        const eventId = this.getAttribute('data-event-id');
        const selectEl = document.querySelector(`.form-select-assign-dropdown[data-event-id="${eventId}"]`);
        const selectedFormId = selectEl ? selectEl.value : '';

        if (!selectedFormId) {
          showAlert('Please select a form to assign.', 'warning');
          return;
        }

        try {
          await updateEvent(eventId, { assignedFormId: selectedFormId });
          showAlert('Form assigned successfully!', 'success');
          renderEventsList();
        } catch (err) {
          showAlert('Failed to assign form: ' + err.message, 'danger');
        }
      });
    });

    // Bind Change Form Button
    document.querySelectorAll('.btn-change-form-trigger').forEach(btn => {
      btn.addEventListener('click', function() {
        const eventId = this.getAttribute('data-event-id');
        const cardEl = document.querySelector(`.event-card-container[data-event-id="${eventId}"]`);
        if (cardEl) {
          const badgeContainer = cardEl.querySelector('.assigned-form-badge-container');
          if (badgeContainer) badgeContainer.style.display = 'none';
          const assignBox = cardEl.querySelector('.assign-form-box');
          if (assignBox) assignBox.style.display = 'block';
        }
      });
    });

    // Bind Preview Button -> Opens Read-Only Form Preview (Freeze Mode) for assigned form
    document.querySelectorAll('.preview-event-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const eventObj = state.events.find(ev => String(ev._id) === String(id));
        const formId = (eventObj && eventObj.assignedFormId && String(eventObj.assignedFormId).trim() !== '')
          ? String(eventObj.assignedFormId).trim()
          : id;

        if (!eventObj || (!eventObj.assignedFormId && (!eventObj.formSchema || eventObj.formSchema.length === 0))) {
          showAlert('Assign Form before previewing.', 'warning');
          return;
        }

        navigate(`#preview-form/${formId}`);
      });
    });

    // Bind Publish / Unpublish Buttons with Strict Form Assignment Validation
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const targetStatus = this.getAttribute('data-status');
        const eventObj = state.events.find(ev => String(ev._id) === String(id));
        const eventTitle = eventObj?.title || 'this event';

        if (targetStatus === 'published') {
          const hasFormAssigned = Boolean(eventObj && ((eventObj.assignedFormId && String(eventObj.assignedFormId).trim() !== '') || (Array.isArray(eventObj.formSchema) && eventObj.formSchema.length > 0)));
          if (!hasFormAssigned) {
            await showConfirmModal({
              icon: '⚠️',
              title: 'Form Not Assigned',
              body: `Assign Form before publishing this event.`,
              confirmLabel: 'OK, Got It',
              confirmColor: '#f59e0b'
            });
            return;
          }
          const confirmed = await showConfirmModal({
            icon: '🚀',
            title: 'Publish Event',
            body: `Are you sure you want to publish "${eventTitle}"? This will enable public registration, link copying, and QR codes.`,
            confirmLabel: 'Yes, Publish',
            confirmColor: '#22c55e'
          });
          if (!confirmed) return;
        } else if (targetStatus === 'draft') {
          const confirmed = await showConfirmModal({
            icon: '⚠️',
            title: 'Unpublish Event',
            body: `Are you sure you want to unpublish "${eventTitle}"? This will disable public registration links and QR codes.`,
            confirmLabel: 'Yes, Unpublish',
            confirmColor: '#ef4444'
          });
          if (!confirmed) return;
        }

        try {
          const isNowPublished = targetStatus === 'published';
          const cardEl = this.closest('.event-card-container');

          if (cardEl) {
            // 1. Update status badge
            const badgeEl = cardEl.querySelector('.event-badge-status');
            if (badgeEl) {
              badgeEl.className = `event-badge-status ${isNowPublished ? 'status-published' : 'status-draft'}`;
              badgeEl.innerHTML = `<span class="status-dot-pulse"></span><span>${isNowPublished ? 'Published' : 'Draft'}</span>`;
            }

            // 2. Update toggle button
            this.setAttribute('data-status', isNowPublished ? 'draft' : 'published');
            this.className = `btn-event-action ${isNowPublished ? 'unpublish-event-btn' : 'publish-event-btn'} toggle-status-btn`;
            this.setAttribute('title', isNowPublished ? 'Unpublish event' : 'Publish event');
            this.innerHTML = isNowPublished ? `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
              <span>Unpublish</span>
            ` : `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <span>Publish</span>
            `;

            // 3. Update secondary utility bar buttons (Copy Link, QR code)
            const copyBtn = cardEl.querySelector('.copy-link-btn');
            const qrBtn = cardEl.querySelector('.view-checkin-qr-btn');
            if (copyBtn) {
              if (isNowPublished) {
                copyBtn.classList.remove('util-disabled');
                copyBtn.removeAttribute('disabled');
                copyBtn.setAttribute('title', 'Copy Public Registration Link');
              } else {
                copyBtn.classList.add('util-disabled');
                copyBtn.setAttribute('disabled', 'disabled');
                copyBtn.setAttribute('title', 'Publish event to enable link');
              }
            }
            if (qrBtn) {
              if (isNowPublished) {
                qrBtn.classList.remove('util-disabled');
                qrBtn.removeAttribute('disabled');
                qrBtn.setAttribute('title', 'View Check-in QR Code');
              } else {
                qrBtn.classList.add('util-disabled');
                qrBtn.setAttribute('disabled', 'disabled');
                qrBtn.setAttribute('title', 'Publish event to enable QR');
              }
            }
          }

          if (eventObj) {
            eventObj.status = targetStatus;
          }

          await updateEvent(id, { status: targetStatus });
          showAlert(`Event "${eventTitle}" ${isNowPublished ? 'published' : 'unpublished'} successfully!`, 'success');
        } catch (err) {
          showAlert('Failed to update event status: ' + err.message, 'danger');
          renderEventsList();
        }
      });
    });

    // Bind Copy Link Button
    document.querySelectorAll('.copy-link-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        copyEventLink(id);
      });
    });

    // Bind QR View Button
    document.querySelectorAll('.view-checkin-qr-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        renderEventCheckinQrModal(id);
      });
    });

    // Bind Edit Button
    document.querySelectorAll('.edit-event-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        let eventObj = state.events.find(ev => String(ev._id) === String(id));
        try {
          const freshEvent = await getEventById(id);
          if (freshEvent) {
            eventObj = { ...eventObj, ...freshEvent };
          }
        } catch (err) {
          // fallback to local eventObj
        }
        if (eventObj) openCreateEventModal(eventObj, renderEventsList);
      });
    });

    // Bind Delete Button
    document.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id') || this.closest('[data-id]')?.getAttribute('data-id');
        const eventObj = state.events.find(ev => String(ev._id) === String(id));
        const eventTitle = eventObj?.title || 'this event';

        const confirmed = await showConfirmModal({
          icon: '🗑️',
          title: 'Delete Event',
          body: `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
          confirmLabel: 'Yes, Delete',
          confirmColor: '#ef4444'
        });

        if (!confirmed) return;

        try {
          await deleteEvent(id);
          notifyEventDeleted(eventTitle);
          showAlert(`Event "${eventTitle}" deleted successfully!`, 'success');
          renderEventsList();
        } catch (err) {
          showAlert('Failed to delete event: ' + err.message, 'danger');
        }
      });
    });

  } catch (err) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('events', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Events Management', false)}
          <main class="content-body"><div class="alert alert-danger">${err.message}</div></main>
        </div>
      </div>
    `;
  }
}

export async function renderEventCheckinQrModal(eventId) {
  let modalHolder = document.getElementById('modal-holder');
  if (!modalHolder) {
    modalHolder = document.createElement('div');
    modalHolder.id = 'modal-holder';
    document.body.appendChild(modalHolder);
  }

  const eventObj = state.events?.find(e => e._id === eventId);
  const eventTitle = eventObj?.title || 'Event QR Codes';

  let baseHost = window.location.origin;
  try {
    baseHost = await getPublicBaseUrl();
  } catch (err) {}

  let attendanceQrUrl, foodQrUrl;
  try {
    attendanceQrUrl = buildQrUrl(baseHost, '#checkin', eventId);
    foodQrUrl = buildQrUrl(baseHost, '#food-counter', eventId);
  } catch (err) {
    showAlert('Invalid public URL configuration for QR generation.', 'danger');
    return;
  }

  let currentTab = 'checkin'; // 'checkin' | 'food'

  function renderModalContent() {
    const isCheckin = currentTab === 'checkin';
    const targetUrl = isCheckin ? attendanceQrUrl : foodQrUrl;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(targetUrl)}`;

    modalHolder.innerHTML = `
      <div class="modal-overlay" style="display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; position:fixed; inset:0;">
        <div class="modal-container" style="max-width:540px; width:92%; text-align:center; padding:32px 28px; background:#ffffff; border-radius:28px; box-shadow:0 25px 60px rgba(0,0,0,0.25); border:none; max-height:92vh; overflow-y:auto;">
          
          <!-- Header title with close button -->
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
            <h3 style="font-size:20px; font-weight:800; color:#0f172a; margin:0; line-height:1.3; text-align:left; flex:1; padding-right:12px;">
              ${eventTitle}
            </h3>
            <button id="close-qr-modal-x" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; color:#64748b; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">✕</button>
          </div>

          <!-- Top Navigation Pill Tabs -->
          <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:14px; margin-bottom:18px; gap:6px;">
            <button type="button" id="tab-qr-checkin" style="flex:1; padding:10px 14px; border:none; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; transition:all 0.2s; ${isCheckin ? 'background:#ffffff; color:#10b981; box-shadow:0 2px 8px rgba(0,0,0,0.06);' : 'background:transparent; color:#64748b;'}">
              📱 Event Check-in
            </button>
            <button type="button" id="tab-qr-food" style="flex:1; padding:10px 14px; border:none; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; transition:all 0.2s; ${!isCheckin ? 'background:#ffffff; color:#ea580c; box-shadow:0 2px 8px rgba(0,0,0,0.06);' : 'background:transparent; color:#64748b;'}">
              🍽️ Food Counter
            </button>
          </div>

          <!-- Sub-badge Pill Label -->
          <div style="margin-bottom:16px;">
            ${isCheckin ? `
              <span style="display:inline-block; padding:6px 16px; background:#dcfce7; color:#16a34a; font-size:11px; font-weight:800; border-radius:20px; border:1px solid #bbf7d0; letter-spacing:0.5px;">
                📱 UNIFIED EVENT CHECK-IN QR (ATTENDANCE + KIT)
              </span>
            ` : `
              <span style="display:inline-block; padding:6px 16px; background:#ffedd5; color:#ea580c; font-size:11px; font-weight:800; border-radius:20px; border:1px solid #fed7aa; letter-spacing:0.5px;">
                🍽️ SEPARATE FOOD COUPON QR
              </span>
            `}
          </div>

          <!-- Target Desk / Counter URL Box -->
          <div style="margin-bottom:20px; text-align:left;">
            <div style="font-size:11px; font-weight:800; color:#64748b; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:6px;">
              TARGET DESK / COUNTER URL:
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:6px 6px 6px 14px; display:flex; align-items:center; justify-content:space-between;">
              <span style="font-family:monospace; font-size:12.5px; color:${isCheckin ? '#10b981' : '#ea580c'}; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:12px; flex:1;">
                ${targetUrl}
              </span>
              <div style="display:flex; gap:6px; flex-shrink:0;">
                <button type="button" id="btn-copy-target-url" style="background:#e0e7ff; color:#4338ca; border:none; padding:7px 12px; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                  📋 Copy
                </button>
                <a href="${targetUrl}" target="_blank" style="background:${isCheckin ? '#10b981' : '#ea580c'}; color:#ffffff; border:none; padding:7px 12px; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                  🔗 Open ↗
                </a>
              </div>
            </div>
          </div>

          <!-- QR Code Display Box -->
          <div style="display:flex; justify-content:center; align-items:center; width:100%; margin-bottom:20px;">
            <div style="background:#ffffff; padding:20px; border:2px solid ${isCheckin ? '#bbf7d0' : '#fed7aa'}; border-radius:24px; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(0,0,0,0.06);">
              <img src="${qrImgSrc}" alt="Event QR Code" style="width:200px; height:200px; display:block; margin:0 auto;" />
            </div>
          </div>

          <!-- Description Notice -->
          <div style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:14px; padding:12px 16px; margin-bottom:24px;">
            <p style="font-size:12.5px; color:#475569; font-weight:600; margin:0; line-height:1.5;">
              ${isCheckin 
                ? 'Scan this QR Code at venue entrance for instant participant mobile check-in, attendance marking, and kit collection verification.'
                : 'Scan this QR Code at food counter for instant participant mobile verification and food coupon redemption.'
              }
            </p>
          </div>

          <!-- Bottom Action Buttons Row -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <button type="button" id="btn-download-qr-action" style="background:#10b981; color:#ffffff; border:none; padding:13px; border-radius:14px; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
              📥 Download QR (PNG)
            </button>
            <button type="button" id="btn-print-pass-action" style="background:#0f172a; color:#ffffff; border:none; padding:13px; border-radius:14px; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
              🖨️ Print Pass
            </button>
          </div>

        </div>
      </div>
    `;

    const closeModal = () => { modalHolder.innerHTML = ''; };
    document.getElementById('close-qr-modal-x')?.addEventListener('click', closeModal);

    document.getElementById('tab-qr-checkin')?.addEventListener('click', () => {
      currentTab = 'checkin';
      renderModalContent();
    });
    document.getElementById('tab-qr-food')?.addEventListener('click', () => {
      currentTab = 'food';
      renderModalContent();
    });

    document.getElementById('btn-copy-target-url')?.addEventListener('click', async function() {
      const origText = this.innerHTML;
      const success = await copyToClipboard(targetUrl, 'Desk URL copied to clipboard!');
      if (success) {
        this.innerHTML = '✓ Copied!';
        setTimeout(() => { this.innerHTML = origText; }, 2000);
      }
    });

    document.getElementById('btn-download-qr-action')?.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = qrImgSrc;
      link.download = `${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${currentTab}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    document.getElementById('btn-print-pass-action')?.addEventListener('click', () => {
      const printWin = window.open('', '_blank');
      printWin.document.write(`
        <html>
          <head>
            <title>Print Pass - ${eventTitle}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              h1 { font-size: 24px; color: #0f172a; }
              p { color: #64748b; font-size: 14px; }
              img { width: 260px; height: 260px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>${eventTitle}</h1>
            <p>${isCheckin ? 'UNIFIED EVENT CHECK-IN QR (ATTENDANCE + KIT)' : 'SEPARATE FOOD COUPON QR'}</p>
            <img src="${qrImgSrc}" />
            <p style="font-family:monospace; font-weight:bold;">${targetUrl}</p>
            <script>window.onload = function() { window.print(); window.close(); };</script>
          </body>
        </html>
      `);
      printWin.document.close();
    });
  }

  renderModalContent();
}

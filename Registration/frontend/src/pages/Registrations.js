import { state, navigate } from '../app.js';
import { getEvents } from '../services/eventService.js';
import { getRegistrations, getAllRegistrations, bulkApproveParticipants, bulkRejectParticipants, sendBulkEmail } from '../services/registrationService.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { showAlert, exportToExcelCSV, formatISTTime, formatISTDateTime } from '../utils/helpers.js';
import { openBulkImportModal } from '../components/events/BulkImportModal.js';

import { API_BASE } from '../utils/constants.js';

export async function renderRegistrations() {
  const hash = window.location.hash || '#registrations';
  const targetEventId = hash.split('/')[1] || null;

  if (targetEventId && targetEventId !== 'all') {
    return renderEventSpecificRegistrations(targetEventId);
  }

  return renderRegistrationsLandingView();
}

/**
 * Helper function to match registration record to an event document
 */
function isRegistrationForEvent(r, ev) {
  if (!r || !ev) return false;
  const evId = String(ev._id || ev.id || '').trim();
  const evTitle = String(ev.title || '').trim().toLowerCase();

  const regEvId = typeof r.eventId === 'object' ? String(r.eventId?._id || '') : String(r.eventId || '');
  const regEvTitle = String(r.eventId?.title || r.eventTitle || r.event || '').trim().toLowerCase();

  if (evId && regEvId && (regEvId === evId || regEvId.includes(evId) || evId.includes(regEvId))) {
    return true;
  }
  if (evTitle && regEvTitle && evTitle === regEvTitle) {
    return true;
  }
  return false;
}

/**
 * 1. REGISTRATIONS LANDING VIEW (Event Cards Grid)
 */
export async function renderRegistrationsLandingView() {
  try {
    const [rawEvents, rawRegs] = await Promise.all([
      getEvents(),
      getAllRegistrations().catch(() => [])
    ]);

    const events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);
    const allRegistrations = rawRegs.registrations || (Array.isArray(rawRegs) ? rawRegs : []);

    const cardsHTML = events.length > 0 ? events.map(ev => {
      const eventRegs = allRegistrations.filter(r => isRegistrationForEvent(r, ev));
      const totalCount = eventRegs.length;
      const approvedCount = eventRegs.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'APPROVED').length;
      const pendingCount = eventRegs.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'PENDING').length;
      const rejectedCount = eventRegs.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'REJECTED').length;

      return `
        <div class="event-reg-card" data-event-id="${ev._id}" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:18px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.03); display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor:pointer;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <span style="background:#e0e7ff; color:#4338ca; font-size:11px; font-weight:800; padding:4px 10px; border-radius:10px; text-transform:uppercase; letter-spacing:0.5px;">
                ${ev.category || 'EVENT'}
              </span>
              <span style="font-size:11.5px; font-weight:800; color:#16a34a; background:#f0fdf4; padding:3px 10px; border-radius:12px; border:1px solid #bbf7d0;">
                ${approvedCount} Approved
              </span>
            </div>

            <h3 style="font-size:19px; font-weight:800; color:#0f172a; margin:0 0 14px 0; line-height:1.3;">${ev.title || 'Untitled Event'}</h3>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:14px 16px; margin-bottom:18px;">
              <div style="font-size:24px; font-weight:900; color:#4f46e5; line-height:1.2;">
                ${totalCount} <span style="font-size:13.5px; font-weight:700; color:#64748b;">Registered</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; margin-top:10px; font-size:12.5px; font-weight:700;">
                <span style="color:#d97706; display:inline-flex; align-items:center; gap:4px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:#f59e0b;"></span> ${pendingCount} Pending
                </span>
                <span style="color:#16a34a; display:inline-flex; align-items:center; gap:4px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:#22c55e;"></span> ${approvedCount} Approved
                </span>
                <span style="color:#dc2626; display:inline-flex; align-items:center; gap:4px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:#ef4444;"></span> ${rejectedCount} Rejected
                </span>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:8px;">
            <button type="button" class="view-event-regs-btn" data-event-id="${ev._id}" style="flex:1; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#ffffff; border:none; padding:12px 14px; border-radius:12px; font-size:13.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 14px rgba(99,102,241,0.3);">
              <span>Manage Approvals</span>
              <span>→</span>
            </button>
            <button type="button" class="card-import-data-btn" data-event-id="${ev._id}" style="background:#eff6ff; color:#4338ca; border:1.5px solid #c7d2fe; padding:12px 14px; border-radius:12px; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;" title="Upload Registered Participants (Excel / Google Sheet)">
              <span>📥 Import</span>
            </button>
          </div>
        </div>
      `;
    }).join('') : `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 18px; border: 1px solid #e2e8f0; color: #64748b;">
        <p style="font-size:18px; font-weight:700; margin-bottom:8px; color:#0f172a;">No events found.</p>
        <p style="font-size:14px; margin-bottom:20px;">Create an event in the Events page to start tracking registrations.</p>
      </div>
    `;

    const html = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Registration Management</h2>
          <p style="font-size: 13px; color: #64748b;">Select an event card below to review participant approvals and check-in status.</p>
        </div>
        <button id="reg-export-all-btn" class="btn btn-primary" style="background-color:#10b981; border:none; padding:10px 20px; border-radius:10px; font-weight:700; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
          📊 Download All Registrations
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
        ${cardsHTML}
      </div>
    `;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('registrations', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Registration Management', false)}
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

    document.getElementById('reg-export-all-btn')?.addEventListener('click', () => {
      exportToExcelCSV(allRegistrations, 'All_Registrations_Report.csv');
    });

    // Card click handlers
    document.querySelectorAll('.event-reg-card, .view-event-regs-btn').forEach(el => {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        const evId = this.getAttribute('data-event-id');
        if (evId) {
          navigate(`#registrations/${evId}`);
        }
      });
    });

    // Card import data buttons
    document.querySelectorAll('.card-import-data-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const evId = this.getAttribute('data-event-id');
        const ev = events.find(item => String(item._id) === String(evId));
        if (ev) {
          openBulkImportModal(ev, () => {
            renderRegistrationsLandingView();
          });
        }
      });
    });

  } catch (error) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('registrations', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Registration Management', false)}
          <main class="content-body"><div class="alert alert-danger">${error.message}</div></main>
        </div>
      </div>
    `;
  }
}

/**
 * 2. EVENT-SPECIFIC REGISTRATIONS VIEW (Table & Bulk Approval Dashboard)
 */
export async function renderEventSpecificRegistrations(eventId, filterState = {}) {
  try {
    const filters = typeof filterState === 'string'
      ? { search: filterState, statusFilter: 'pending', dateFilter: 'all', customFrom: '', customTo: '', attendanceFilter: 'all', foodFilter: 'all', rangeStart: '', rangeEnd: '' }
      : {
          search: filterState.search || '',
          statusFilter: filterState.statusFilter || 'pending',
          dateFilter: filterState.dateFilter || 'all',
          customFrom: filterState.customFrom || '',
          customTo: filterState.customTo || '',
          attendanceFilter: filterState.attendanceFilter || 'all',
          foodFilter: filterState.foodFilter || 'all',
          rangeStart: filterState.rangeStart || '',
          rangeEnd: filterState.rangeEnd || ''
        };

    const [rawEvents, rawData] = await Promise.all([
      getEvents(),
      getRegistrations(eventId).catch(() => getAllRegistrations())
    ]);

    const events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);
    const selectedEvent = events.find(e => String(e._id) === String(eventId)) || rawData.event || { _id: eventId, title: 'Event' };

    const rawRegs = rawData.registrations || (Array.isArray(rawData) ? rawData : []);
    const totalEventRegistrations = rawRegs.filter(r => isRegistrationForEvent(r, selectedEvent));
    const totalCount = totalEventRegistrations.length;

    // Calculate Summary metrics
    const summary = rawData.summary || {
      capacity: selectedEvent.capacity || 0,
      totalRegistrations: totalCount,
      approvedCount: totalEventRegistrations.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'APPROVED').length,
      pendingCount: totalEventRegistrations.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'PENDING').length,
      rejectedCount: totalEventRegistrations.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'REJECTED').length,
      remainingSlots: selectedEvent.capacity ? Math.max(0, selectedEvent.capacity - totalEventRegistrations.filter(r => (r.approvalStatus || 'PENDING').toUpperCase() === 'APPROVED').length) : 'Unlimited'
    };

    let registrations = [...totalEventRegistrations];

    // 1. Status Filter
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      const targetStatus = filters.statusFilter.toUpperCase();
      if (targetStatus === 'PENDING') {
        registrations = registrations.filter(r => !r.approvalStatus || String(r.approvalStatus).toUpperCase() === 'PENDING');
      } else {
        registrations = registrations.filter(r => String(r.approvalStatus).toUpperCase() === targetStatus);
      }
    }

    // 2. Search Filter
    const sTerm = filters.search.trim().toLowerCase();
    if (sTerm) {
      registrations = registrations.filter(r => {
        const name = (r.fullName || r.participantName || r.formData?.['Full Name'] || r.formData?.['name'] || '').toLowerCase();
        const email = (r.email || r.participantEmail || r.formData?.['Email'] || r.formData?.['email'] || '').toLowerCase();
        const phone = (r.phone || r.participantPhone || r.formData?.['Phone Number'] || r.formData?.['mobile'] || '').toLowerCase();
        const regId = (r.registrationId || r._id || '').toLowerCase();
        return name.includes(sTerm) || email.includes(sTerm) || phone.includes(sTerm) || regId.includes(sTerm);
      });
    }

    // 3. Attendance Filter
    if (filters.attendanceFilter === 'present') {
      registrations = registrations.filter(r => r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present');
    } else if (filters.attendanceFilter === 'absent') {
      registrations = registrations.filter(r => !(r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present'));
    }

    // 4. Food Filter
    if (filters.foodFilter === 'issued' || filters.foodFilter === 'taken') {
      registrations = registrations.filter(r => r.foodRedeemed === true || r.foodIssued === true || r.foodTaken === true);
    } else if (filters.foodFilter === 'not_issued' || filters.foodFilter === 'not_taken') {
      registrations = registrations.filter(r => !(r.foodRedeemed === true || r.foodIssued === true || r.foodTaken === true));
    }

    const badgeText = `Showing ${registrations.length} of ${totalCount} Participants`;

    // Local set to track checked registration IDs for bulk operations
    const selectedIds = new Set(Array.isArray(filterState.selectedIds) ? filterState.selectedIds : []);

    // Prune selectedIds to remove participants that are hidden by current active filters
    const visibleIdsSet = new Set(registrations.map(r => String(r._id)));
    for (const id of Array.from(selectedIds)) {
      if (!visibleIdsSet.has(id)) {
        selectedIds.delete(id);
      }
    }

    const tableRows = registrations.length > 0 ? registrations.map((r, idx) => {
      const name = r.fullName || r.participantName || r.formData?.['Full Name'] || r.formData?.['name'] || r.formData?.['Name'] || 'Participant';
      const email = r.email || r.participantEmail || r.formData?.['Email'] || r.formData?.['email'] || 'N/A';
      const phone = r.phone || r.participantPhone || r.formData?.['Phone Number'] || r.formData?.['mobile'] || 'N/A';
      const isAttended = r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present';
      const isKitIssued = r.kitIssued === true;
      const isFoodIssued = r.foodRedeemed === true || r.foodIssued === true || r.foodTaken === true;
      const appliedDate = r.registeredAt ? formatISTDateTime(r.registeredAt) : 'N/A';
      const regId = String(r._id);
      const shortRegId = r.registrationId || `#REG-${regId.substring(18).toUpperCase()}`;

      const approvalStatus = (r.approvalStatus || 'PENDING').toUpperCase();

      let approvalBadgeHTML = '';
      if (approvalStatus === 'APPROVED') {
        approvalBadgeHTML = `<span style="background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; font-size:12px; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">✓ APPROVED</span>`;
      } else if (approvalStatus === 'REJECTED') {
        approvalBadgeHTML = `<span style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; font-size:12px; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">✕ REJECTED</span>`;
      } else {
        approvalBadgeHTML = `<span style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-size:12px; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">⏳ PENDING</span>`;
      }

      const isChecked = selectedIds.has(regId);

      return `
        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" hover-style="background:#f8fafc;">
          <td style="padding: 14px 12px; text-align: center;">
            <input type="checkbox" class="participant-select-cb" data-id="${regId}" ${isChecked ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer; accent-color:#4f46e5;" />
          </td>
          <td style="padding: 14px 16px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${name}</div>
            <div style="font-size: 12px; color: #4338ca; font-weight:600;">${email}</div>
          </td>
          <td style="padding: 14px 16px;">
            <div style="font-size: 13px; font-weight: 700; color: #334155;">${phone}</div>
            <div style="font-size: 11px; font-family: monospace; color: #64748b;">${shortRegId}</div>
          </td>
          <td style="padding: 14px 16px; font-size: 12px; color: #475569; font-weight: 600;">
            ${appliedDate}
          </td>
          <td style="padding: 14px 16px;">
            ${approvalBadgeHTML}
          </td>
          <td style="padding: 14px 16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge ${isAttended ? 'badge-published' : 'badge-draft'}" style="font-size:11px;">${isAttended ? 'Entrance ✓' : 'Absent'}</span>
              <span class="badge" style="background:${isKitIssued ? '#dcfce7' : '#f1f5f9'}; color:${isKitIssued ? '#15803d' : '#64748b'}; font-size:11px;">${isKitIssued ? 'Kit ✓' : 'No Kit'}</span>
              <span class="badge" style="background:${isFoodIssued ? '#ffedd5' : '#f1f5f9'}; color:${isFoodIssued ? '#c2410c' : '#64748b'}; font-size:11px;">${isFoodIssued ? 'Food ✓' : 'No Food'}</span>
            </div>
          </td>
          <td style="padding: 14px 16px;">
            <button class="view-reg-btn btn btn-sm btn-outline" data-id="${regId}" data-idx="${idx}" style="font-weight:700; border-radius:8px; padding:6px 14px; font-size:12px;">Details</button>
          </td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 600;">
          No registration records match the active status or criteria for ${selectedEvent.title}.
        </td>
      </tr>
    `;

    const html = `
      <!-- Participant Details Modal -->
      <div id="reg-details-modal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#ffffff; border-radius:24px; padding:32px 28px; max-width:640px; width:100%; max-height:88vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
            <h3 style="font-size:19px; font-weight:900; color:#0f172a; margin:0;" id="reg-modal-title">Participant Registration Details</h3>
            <button id="reg-modal-close-btn" style="border:none; background:#f1f5f9; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; color:#64748b; display:inline-flex; align-items:center; justify-content:center;">✕</button>
          </div>
          <div id="reg-modal-content"></div>
        </div>
      </div>

      <!-- Bulk Approval Modal -->
      <div id="bulk-approve-modal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#ffffff; border-radius:24px; padding:32px; max-width:540px; width:100%; box-shadow:0 25px 60px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
          <h3 style="font-size:20px; font-weight:900; color:#0f172a; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span style="color:#10b981;">✓</span> Confirm Bulk Participant Approval
          </h3>
          <div id="bulk-approve-modal-body" style="font-size:14px; color:#334155; margin-bottom:24px;"></div>
          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button id="bulk-approve-cancel-btn" style="background:#f1f5f9; color:#475569; border:none; padding:10px 20px; border-radius:10px; font-weight:700; font-size:13.5px; cursor:pointer;">Cancel</button>
            <button id="bulk-approve-confirm-btn" style="background:#10b981; color:#ffffff; border:none; padding:10px 22px; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.3);">Confirm Approval</button>
          </div>
        </div>
      </div>

      <!-- Bulk Rejection Modal -->
      <div id="bulk-reject-modal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#ffffff; border-radius:24px; padding:32px; max-width:540px; width:100%; box-shadow:0 25px 60px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
          <h3 style="font-size:20px; font-weight:900; color:#0f172a; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span style="color:#ef4444;">✕</span> Confirm Bulk Participant Rejection
          </h3>
          <div id="bulk-reject-modal-body" style="font-size:14px; color:#334155; margin-bottom:24px;"></div>
          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button id="bulk-reject-cancel-btn" style="background:#f1f5f9; color:#475569; border:none; padding:10px 20px; border-radius:10px; font-weight:700; font-size:13.5px; cursor:pointer;">Cancel</button>
            <button id="bulk-reject-confirm-btn" style="background:#ef4444; color:#ffffff; border:none; padding:10px 22px; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer; box-shadow:0 4px 14px rgba(239,68,68,0.3);">Confirm Rejection</button>
          </div>
        </div>
      </div>

      <!-- Bulk Email Composition Modal -->
      <div id="bulk-email-modal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#ffffff; border-radius:24px; padding:32px; max-width:640px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
            <div>
              <h3 style="font-size:20px; font-weight:900; color:#0f172a; margin:0; display:flex; align-items:center; gap:8px;">
                <span style="color:#6366f1;">✉</span> Compose Bulk Email
              </h3>
              <p style="font-size:13px; color:#64748b; margin:4px 0 0;" id="bulk-email-recipient-count">
                Sending to 0 selected participant(s)
              </p>
            </div>
            <button id="bulk-email-close-btn" style="border:none; background:#f1f5f9; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; color:#64748b;">✕</button>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:12.5px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
              Email Subject:
            </label>
            <input type="text" id="bulk-email-subject-input" class="form-control" style="width:100%; height:42px; border-radius:10px; border:1px solid #cbd5e1; padding:0 14px; font-size:14px; font-weight:600; color:#0f172a;" />
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:12.5px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
              Email Message Body:
            </label>
            <textarea id="bulk-email-body-input" class="form-control" rows="10" style="width:100%; border-radius:12px; border:1px solid #cbd5e1; padding:14px; font-size:13.5px; font-family:inherit; color:#0f172a; line-height:1.5; resize:vertical;"></textarea>
          </div>

          <!-- Dynamic Placeholder Badges -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 16px; margin-bottom:24px;">
            <div style="font-size:11.5px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
              💡 Dynamic Placeholder Tags (Automatically Replaced):
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              <span style="background:#e0e7ff; color:#4338ca; font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:6px; font-family:monospace;">{participantName}</span>
              <span style="background:#e0e7ff; color:#4338ca; font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:6px; font-family:monospace;">{eventTitle}</span>
              <span style="background:#e0e7ff; color:#4338ca; font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:6px; font-family:monospace;">{eventDate}</span>
              <span style="background:#e0e7ff; color:#4338ca; font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:6px; font-family:monospace;">{eventVenue}</span>
              <span style="background:#e0e7ff; color:#4338ca; font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:6px; font-family:monospace;">{registrationId}</span>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button id="bulk-email-cancel-btn" style="background:#f1f5f9; color:#475569; border:none; padding:10px 20px; border-radius:10px; font-weight:700; font-size:13.5px; cursor:pointer;">Cancel</button>
            <button id="bulk-email-send-btn" style="background:linear-gradient(135deg,#6366f1,#4f46e5); color:#ffffff; border:none; padding:10px 24px; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer; box-shadow:0 4px 14px rgba(99,102,241,0.3); display:inline-flex; align-items:center; gap:6px;">
              ✉ Send Mails Now
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation & Header Bar -->
      <div style="margin-bottom:20px;">
        <button type="button" id="back-to-events-btn" style="background:#f1f5f9; color:#334155; border:1.5px solid #cbd5e1; padding:8px 16px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin-bottom:16px;">
          ← Back to All Events
        </button>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px;">
              <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin:0;">${selectedEvent.title}</h2>
              <span style="background:#eef2ff; color:#4338ca; font-size:12px; font-weight:800; padding:4px 12px; border-radius:12px;">
                ${badgeText}
              </span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin:4px 0 0;">Participant Registration & Bulk Email/Approval Portal.</p>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <button id="reg-import-btn" class="btn btn-primary" style="background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border:none; padding:9px 18px; border-radius:10px; font-weight:700; font-size:14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 4px 14px rgba(99,102,241,0.3);">
              📥 Upload Data (Excel / Sheet)
            </button>
            <button id="reg-export-btn" class="btn btn-primary" style="background-color:#10b981; border:none; padding:9px 20px; border-radius:10px; font-weight:700; font-size:14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
              📊 Download Excel Report
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Dashboard Card -->
      <div class="card" style="padding: 22px 26px; border-radius: 18px; border: 1.5px solid #e2e8f0; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); margin-bottom: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
          <h4 style="font-size:15px; font-weight:800; color:#0f172a; margin:0; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:8px;">
            <span>🎯</span> Event Capacity & Selection Summary
          </h4>
          <span style="font-size:13px; font-weight:700; color:#4338ca; background:#eef2ff; padding:4px 14px; border-radius:12px; border:1px solid #c7d2fe;">
            Remaining Approval Slots: <strong>${summary.remainingSlots}</strong>
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px;">
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:14px; text-align:center;">
            <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Capacity Limit</div>
            <div style="font-size:22px; font-weight:900; color:#0f172a; margin-top:2px;">${summary.capacity || 'Unlimited'}</div>
          </div>
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:14px; text-align:center;">
            <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Total Registered</div>
            <div style="font-size:22px; font-weight:900; color:#4f46e5; margin-top:2px;">${summary.totalRegistrations}</div>
          </div>
          <div style="background:#ffffff; border:1px solid #bbf7d0; border-radius:14px; padding:14px; text-align:center; background:#f0fdf4;">
            <div style="font-size:11px; font-weight:800; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">Approved</div>
            <div style="font-size:22px; font-weight:900; color:#15803d; margin-top:2px;">${summary.approvedCount}</div>
          </div>
          <div style="background:#ffffff; border:1px solid #fde68a; border-radius:14px; padding:14px; text-align:center; background:#fffbeb;">
            <div style="font-size:11px; font-weight:800; color:#92400e; text-transform:uppercase; letter-spacing:0.5px;">Pending Action</div>
            <div style="font-size:22px; font-weight:900; color:#d97706; margin-top:2px;">${summary.pendingCount}</div>
          </div>
          <div style="background:#ffffff; border:1px solid #fca5a5; border-radius:14px; padding:14px; text-align:center; background:#fef2f2;">
            <div style="font-size:11px; font-weight:800; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px;">Rejected</div>
            <div style="font-size:22px; font-weight:900; color:#dc2626; margin-top:2px;">${summary.rejectedCount}</div>
          </div>
        </div>
      </div>

      <!-- Search & Status Filter Control Bar -->
      <div class="card" style="padding: 18px 22px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
        <div style="display: flex; flex-direction: column; gap: 14px;">
          
          <!-- Status Filter Tabs & Range Selection -->
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid #f1f5f9; padding-bottom:12px; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-right:6px;">Filter Status:</span>
              <button type="button" class="status-tab-btn ${filters.statusFilter === 'pending' ? 'active' : ''}" data-status="pending" style="background:${filters.statusFilter === 'pending' ? '#fef3c7' : '#f8fafc'}; color:${filters.statusFilter === 'pending' ? '#92400e' : '#64748b'}; border:1px solid ${filters.statusFilter === 'pending' ? '#fde68a' : '#cbd5e1'}; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer;">
                ⏳ Pending (${summary.pendingCount})
              </button>
              <button type="button" class="status-tab-btn ${filters.statusFilter === 'approved' ? 'active' : ''}" data-status="approved" style="background:${filters.statusFilter === 'approved' ? '#dcfce7' : '#f8fafc'}; color:${filters.statusFilter === 'approved' ? '#15803d' : '#64748b'}; border:1px solid ${filters.statusFilter === 'approved' ? '#bbf7d0' : '#cbd5e1'}; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer;">
                ✓ Approved (${summary.approvedCount})
              </button>
              <button type="button" class="status-tab-btn ${filters.statusFilter === 'rejected' ? 'active' : ''}" data-status="rejected" style="background:${filters.statusFilter === 'rejected' ? '#fee2e2' : '#f8fafc'}; color:${filters.statusFilter === 'rejected' ? '#b91c1c' : '#64748b'}; border:1px solid ${filters.statusFilter === 'rejected' ? '#fca5a5' : '#cbd5e1'}; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer;">
                ✕ Rejected (${summary.rejectedCount})
              </button>
              <button type="button" class="status-tab-btn ${filters.statusFilter === 'all' ? 'active' : ''}" data-status="all" style="background:${filters.statusFilter === 'all' ? '#e0e7ff' : '#f8fafc'}; color:${filters.statusFilter === 'all' ? '#4338ca' : '#64748b'}; border:1px solid ${filters.statusFilter === 'all' ? '#c7d2fe' : '#cbd5e1'}; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:800; cursor:pointer;">
                📋 All (${summary.totalRegistrations})
              </button>
            </div>

            <!-- Range Selection Control -->
            <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; padding:6px 12px; border-radius:12px; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Select Range:</span>
              <input type="number" id="range-start-input" placeholder="1" min="1" max="200" value="${filters.rangeStart || ''}" style="width:65px; height:34px; border-radius:8px; border:1px solid #cbd5e1; padding:0 8px; font-size:13px; font-weight:700; text-align:center; background:#ffffff; outline:none;" />
              <span style="font-size:12px; font-weight:700; color:#64748b;">to</span>
              <input type="number" id="range-end-input" placeholder="20" min="1" max="200" value="${filters.rangeEnd || ''}" style="width:65px; height:34px; border-radius:8px; border:1px solid #cbd5e1; padding:0 8px; font-size:13px; font-weight:700; text-align:center; background:#ffffff; outline:none;" />
              <button type="button" id="apply-range-btn" style="height:34px; padding:0 14px; border-radius:8px; border:none; background:#4f46e5; color:#ffffff; font-size:12.5px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(79,70,229,0.25);">
                Select Range
              </button>
            </div>
          </div>

          <!-- Search Input & Secondary Filters -->
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="position: relative; flex: 1; min-width: 260px;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 14px;">🔍</span>
              <input type="text" id="reg-search-input" class="form-control" placeholder="Search participant name, email, phone, reg ID..." value="${filters.search}" style="padding-left: 38px; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13.5px; font-weight: 500; width: 100%;">
            </div>

            <!-- Attendance Filter -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <select id="reg-attendance-filter" style="height: 42px; padding: 0 32px 0 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; color: #1e293b; background: #ffffff; cursor: pointer;">
                <option value="all" ${filters.attendanceFilter === 'all' ? 'selected' : ''}>All Attendance</option>
                <option value="present" ${filters.attendanceFilter === 'present' ? 'selected' : ''}>Present</option>
                <option value="absent" ${filters.attendanceFilter === 'absent' ? 'selected' : ''}>Absent</option>
              </select>
            </div>

            <button type="button" id="reg-clear-filters-btn" style="height: 42px; padding: 0 16px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 700; cursor: pointer;">
              ✕ Clear Filters
            </button>
          </div>

        </div>
      </div>

      <!-- Bulk Action Floating Bar -->
      <div id="bulk-action-bar" style="display:none; position:sticky; top:12px; z-index:90; background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color:#ffffff; padding:14px 22px; border-radius:16px; margin-bottom:16px; box-shadow:0 10px 30px rgba(0,0,0,0.2); align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="background:rgba(255,255,255,0.15); padding:4px 12px; border-radius:10px; font-size:13px; font-weight:800;" id="bulk-selected-count">
            0 Selected
          </span>
          <span style="font-size:13px; color:#cbd5e1; font-weight:600;">Use checkboxes to select participants for bulk approvals, rejections, or email dispatch.</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <button id="bulk-email-trigger-btn" style="background:#6366f1; color:#ffffff; border:none; padding:8px 18px; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">
            ✉ Send Bulk Email
          </button>
          <button id="bulk-approve-trigger-btn" style="background:#10b981; color:#ffffff; border:none; padding:8px 18px; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
            ✓ Approve Selected
          </button>
          <button id="bulk-reject-trigger-btn" style="background:#ef4444; color:#ffffff; border:none; padding:8px 18px; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
            ✕ Reject Selected
          </button>
          <button id="bulk-clear-selection-btn" style="background:transparent; color:#94a3b8; border:1px solid #475569; padding:8px 14px; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer;">
            Clear Selection
          </button>
        </div>
      </div>

      <!-- Participant Table Container -->
      <div class="card" style="border-radius: 16px; border: 1px solid #e2e8f0; background: white; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.02);">
        <div class="table-responsive">
          <table class="table" style="width: 100%; margin-bottom: 0; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0;">
                <th style="padding: 14px 12px; text-align: left; min-width: 110px;">
                  <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; text-transform: uppercase;">
                    <input type="checkbox" id="select-all-cb" style="width: 18px; height: 18px; cursor: pointer; accent-color: #4f46e5;" />
                    <span>Select All</span>
                  </label>
                </th>
                <th style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; padding: 14px 16px;">APPLICANT</th>
                <th style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; padding: 14px 16px;">CONTACT / REG ID</th>
                <th style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; padding: 14px 16px;">REGISTERED AT</th>
                <th style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; padding: 14px 16px;">APPROVAL STATUS</th>
                <th style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; padding: 14px 16px;">CHECK-IN / SERVICES</th>
                <th style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px; padding: 14px 16px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('registrations', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Registration Management', false)}
          <main class="content-body">${html}</main>
        </div>
      </div>
    `;

    // -------------------------------------------------------------
    // EVENT LISTENERS & BULK ACTION LOGIC
    // -------------------------------------------------------------

    // Helper to update Floating Toolbar UI & Select All checkbox state
    const updateBulkToolbar = () => {
      const count = selectedIds.size;
      const bar = document.getElementById('bulk-action-bar');
      const countEl = document.getElementById('bulk-selected-count');
      const selectAllCb = document.getElementById('select-all-cb');

      if (bar) bar.style.display = count > 0 ? 'flex' : 'none';
      if (countEl) countEl.textContent = `${count} Selected`;

      const visibleCbs = Array.from(document.querySelectorAll('.participant-select-cb'));
      if (selectAllCb) {
        if (visibleCbs.length > 0) {
          const selectedVisibleCount = visibleCbs.filter(cb => cb.checked).length;
          if (selectedVisibleCount === visibleCbs.length) {
            selectAllCb.checked = true;
            selectAllCb.indeterminate = false;
          } else if (selectedVisibleCount > 0) {
            selectAllCb.checked = false;
            selectAllCb.indeterminate = true;
          } else {
            selectAllCb.checked = false;
            selectAllCb.indeterminate = false;
          }
        } else {
          selectAllCb.checked = false;
          selectAllCb.indeterminate = false;
        }
      }
    };

    // Initialize toolbar and header checkbox state immediately
    updateBulkToolbar();

    // Row Checkbox Listeners
    document.querySelectorAll('.participant-select-cb').forEach(cb => {
      cb.addEventListener('change', function() {
        const id = this.getAttribute('data-id');
        if (this.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        updateBulkToolbar();
      });
    });

    // Select All Checkbox Listener
    document.getElementById('select-all-cb')?.addEventListener('change', function() {
      const isChecked = this.checked;
      document.querySelectorAll('.participant-select-cb').forEach(cb => {
        cb.checked = isChecked;
        const id = cb.getAttribute('data-id');
        if (isChecked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
      });
      updateBulkToolbar();
    });

    // Apply Range Button Listener
    document.getElementById('apply-range-btn')?.addEventListener('click', () => {
      const startEl = document.getElementById('range-start-input');
      const endEl = document.getElementById('range-end-input');

      const startRaw = startEl?.value?.trim();
      const endRaw = endEl?.value?.trim();

      if (!startRaw || !endRaw) {
        showAlert('Please enter both start and end numbers for range selection.', 'warning');
        return;
      }

      const start = Number(startRaw);
      const end = Number(endRaw);

      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
        showAlert('Range values must be positive whole numbers.', 'warning');
        return;
      }

      if (start > end) {
        showAlert('Start number cannot be greater than end number.', 'warning');
        return;
      }

      if (start > 200 || end > 200) {
        showAlert('Maximum allowed range value is 200.', 'warning');
        return;
      }

      if (registrations.length === 0) {
        showAlert('No participants in the current filtered view to select.', 'warning');
        return;
      }

      // Select participants in displayed/filtered row range (1-indexed)
      const startIndex = start - 1;
      const endIndex = Math.min(end, registrations.length);

      selectedIds.clear();
      for (let i = startIndex; i < endIndex; i++) {
        if (registrations[i]) {
          selectedIds.add(String(registrations[i]._id));
        }
      }

      // Synchronize DOM row checkboxes
      document.querySelectorAll('.participant-select-cb').forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = selectedIds.has(id);
      });

      updateBulkToolbar();

      const selectedCount = endIndex - startIndex;
      if (selectedCount > 0) {
        showAlert(`Selected range ${start}–${endIndex} (${selectedCount} participant(s)).`, 'success');
      } else {
        showAlert('Start index exceeds total displayed participants.', 'warning');
      }
    });

    // Clear Selection Button Listener
    document.getElementById('bulk-clear-selection-btn')?.addEventListener('click', () => {
      selectedIds.clear();
      document.querySelectorAll('.participant-select-cb').forEach(cb => cb.checked = false);
      updateBulkToolbar();
    });

    // Bulk Email Trigger Listener -> Opens Compose Modal
    document.getElementById('bulk-email-trigger-btn')?.addEventListener('click', () => {
      const count = selectedIds.size;
      if (count === 0) return;

      const modal = document.getElementById('bulk-email-modal');
      const countText = document.getElementById('bulk-email-recipient-count');
      const subjectInput = document.getElementById('bulk-email-subject-input');
      const bodyInput = document.getElementById('bulk-email-body-input');

      if (!modal || !subjectInput || !bodyInput) return;

      if (countText) countText.textContent = `Sending custom email to ${count} selected participant(s)`;

      const eventTitleStr = selectedEvent.title || 'Event';
      const eventDateStr = selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'As scheduled';
      const eventVenueStr = selectedEvent.location || 'Venue as announced';

      subjectInput.value = `Special Invitation: ${eventTitleStr}`;
      bodyInput.value = `Dear {participantName},

We are pleased to send you this special invitation for the upcoming event: {eventTitle}.

Event Details:
- Event: {eventTitle}
- Date: {eventDate}
- Location / Venue: {eventVenue}
- Your Registration Reference ID: {registrationId}

Please keep your Registration Reference ID handy when attending the venue. We look forward to welcoming you!

Warm regards,
RTIH Event Management Team`;

      modal.style.display = 'flex';
    });

    // Bulk Email Modal Close / Cancel Buttons
    const closeBulkEmailModal = () => {
      const modal = document.getElementById('bulk-email-modal');
      if (modal) modal.style.display = 'none';
    };

    document.getElementById('bulk-email-close-btn')?.addEventListener('click', closeBulkEmailModal);
    document.getElementById('bulk-email-cancel-btn')?.addEventListener('click', closeBulkEmailModal);

    // Bulk Email Modal Confirm Send Action
    document.getElementById('bulk-email-send-btn')?.addEventListener('click', async function() {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      const subject = document.getElementById('bulk-email-subject-input')?.value || '';
      const bodyText = document.getElementById('bulk-email-body-input')?.value || '';

      if (!subject.trim()) {
        showAlert('Please enter an email subject.', 'warning');
        return;
      }

      if (!bodyText.trim()) {
        showAlert('Please enter an email message body.', 'warning');
        return;
      }

      this.disabled = true;
      this.textContent = 'Sending Mails...';

      try {
        const res = await sendBulkEmail(ids, subject, bodyText);
        closeBulkEmailModal();
        showAlert(`✉ Successfully dispatched bulk emails to ${res.sentCount} participant(s) in seconds!`, 'success');
        selectedIds.clear();
        updateBulkToolbar();
      } catch (err) {
        showAlert(err.message || 'Failed to dispatch bulk email.', 'danger');
      } finally {
        this.disabled = false;
        this.textContent = '✉ Send Mails Now';
      }
    });

    // Bulk Approve Trigger Listener -> Opens Modal
    document.getElementById('bulk-approve-trigger-btn')?.addEventListener('click', () => {
      const count = selectedIds.size;
      if (count === 0) return;

      const modal = document.getElementById('bulk-approve-modal');
      const body = document.getElementById('bulk-approve-modal-body');
      const confirmBtn = document.getElementById('bulk-approve-confirm-btn');
      if (!modal || !body || !confirmBtn) return;

      const remainingSlotsNum = typeof summary.remainingSlots === 'number' ? summary.remainingSlots : Infinity;
      const isExceeding = count > remainingSlotsNum;

      let alertHTML = '';
      if (isExceeding) {
        alertHTML = `
          <div style="background:#fef2f2; border:1.5px solid #fca5a5; border-radius:12px; padding:14px; color:#991b1b; margin-top:14px; font-weight:700;">
            ⚠️ Cannot approve selection. You selected <strong>${count}</strong> participant(s), but only <strong>${remainingSlotsNum}</strong> remaining slot(s) are available for this event (Capacity: ${summary.capacity}). Please reduce your selection.
          </div>
        `;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
      } else {
        const slotsLeftAfter = remainingSlotsNum === Infinity ? 'Unlimited' : (remainingSlotsNum - count);
        alertHTML = `
          <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:14px; color:#166534; margin-top:14px; font-weight:700;">
            ✓ Approving <strong>${count}</strong> participant(s) will leave <strong>${slotsLeftAfter}</strong> remaining slot(s) available for this event.
          </div>
        `;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
      }

      body.innerHTML = `
        <p style="margin-top:0;">You are about to approve <strong>${count} participant(s)</strong> for event: <strong>${selectedEvent.title}</strong>.</p>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
            <span>Event Total Capacity:</span>
            <strong>${summary.capacity || 'Unlimited'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
            <span>Currently Approved Count:</span>
            <strong>${summary.approvedCount}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px;">
            <span>Available Slots:</span>
            <strong style="color:#4338ca;">${summary.remainingSlots}</strong>
          </div>
        </div>
        ${alertHTML}
      `;

      modal.style.display = 'flex';
    });

    // Bulk Approve Modal Cancel Button
    document.getElementById('bulk-approve-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('bulk-approve-modal').style.display = 'none';
    });

    // Bulk Approve Modal Confirm Action Button
    document.getElementById('bulk-approve-confirm-btn')?.addEventListener('click', async function() {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      this.disabled = true;
      this.textContent = 'Approving...';

      try {
        const res = await bulkApproveParticipants(ids);
        document.getElementById('bulk-approve-modal').style.display = 'none';
        showAlert(`✓ Successfully approved ${res.approvedCount} participant(s). Email notifications dispatched.`, 'success');
        selectedIds.clear();
        renderEventSpecificRegistrations(eventId, filters);
      } catch (err) {
        showAlert(err.message || 'Failed to bulk approve participants.', 'danger');
        this.disabled = false;
        this.textContent = 'Confirm Approval';
      }
    });

    // Bulk Reject Trigger Listener -> Opens Modal
    document.getElementById('bulk-reject-trigger-btn')?.addEventListener('click', () => {
      const count = selectedIds.size;
      if (count === 0) return;

      const modal = document.getElementById('bulk-reject-modal');
      const body = document.getElementById('bulk-reject-modal-body');
      const confirmBtn = document.getElementById('bulk-reject-confirm-btn');
      if (!modal || !body || !confirmBtn) return;

      body.innerHTML = `
        <p style="margin-top:0;">Are you sure you want to reject <strong>${count} participant(s)</strong> for event: <strong>${selectedEvent.title}</strong>?</p>
        <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:12px; padding:14px; color:#991b1b; font-weight:600; font-size:13px;">
          ✕ Each rejected participant will receive an update email notifying them that their registration could not be approved due to capacity limits.
        </div>
      `;

      confirmBtn.disabled = false;
      modal.style.display = 'flex';
    });

    // Bulk Reject Modal Cancel Button
    document.getElementById('bulk-reject-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('bulk-reject-modal').style.display = 'none';
    });

    // Bulk Reject Modal Confirm Action Button
    document.getElementById('bulk-reject-confirm-btn')?.addEventListener('click', async function() {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      this.disabled = true;
      this.textContent = 'Rejecting...';

      try {
        const res = await bulkRejectParticipants(ids);
        document.getElementById('bulk-reject-modal').style.display = 'none';
        showAlert(`✕ Successfully rejected ${res.rejectedCount} participant(s). Notification emails sent.`, 'info');
        selectedIds.clear();
        renderEventSpecificRegistrations(eventId, filters);
      } catch (err) {
        showAlert(err.message || 'Failed to bulk reject participants.', 'danger');
        this.disabled = false;
        this.textContent = 'Confirm Rejection';
      }
    });

    // Logout Listener
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('#login');
    });

    document.getElementById('back-to-events-btn')?.addEventListener('click', () => {
      navigate('#registrations');
    });

    document.getElementById('reg-export-btn')?.addEventListener('click', () => {
      exportToExcelCSV(registrations, `${(selectedEvent.title || 'Event').replace(/\s+/g, '_')}_Registrations.csv`);
    });

    document.getElementById('reg-import-btn')?.addEventListener('click', () => {
      openBulkImportModal(selectedEvent, () => {
        renderEventSpecificRegistrations(eventId);
      });
    });

    // Status Tab Listeners
    document.querySelectorAll('.status-tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const status = this.getAttribute('data-status');
        const search = document.getElementById('reg-search-input')?.value || '';
        const attendanceFilter = document.getElementById('reg-attendance-filter')?.value || 'all';
        const rangeStart = document.getElementById('range-start-input')?.value || '';
        const rangeEnd = document.getElementById('range-end-input')?.value || '';
        renderEventSpecificRegistrations(eventId, {
          ...filters,
          statusFilter: status,
          search,
          attendanceFilter,
          rangeStart,
          rangeEnd,
          selectedIds: Array.from(selectedIds)
        });
      });
    });

    const applyFilters = () => {
      const search = document.getElementById('reg-search-input')?.value || '';
      const attendanceFilter = document.getElementById('reg-attendance-filter')?.value || 'all';
      const rangeStart = document.getElementById('range-start-input')?.value || '';
      const rangeEnd = document.getElementById('range-end-input')?.value || '';
      renderEventSpecificRegistrations(eventId, {
        ...filters,
        search,
        attendanceFilter,
        rangeStart,
        rangeEnd,
        selectedIds: Array.from(selectedIds)
      });
    };

    const clearFilters = () => {
      renderEventSpecificRegistrations(eventId, {
        statusFilter: 'pending',
        search: '',
        dateFilter: 'all',
        attendanceFilter: 'all',
        foodFilter: 'all',
        rangeStart: '',
        rangeEnd: '',
        selectedIds: []
      });
    };

    document.getElementById('reg-clear-filters-btn')?.addEventListener('click', clearFilters);
    document.getElementById('reg-attendance-filter')?.addEventListener('change', applyFilters);
    document.getElementById('reg-search-input')?.addEventListener('input', applyFilters);
    document.getElementById('reg-search-input')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applyFilters();
    });

    // View Details button handler
    const handleViewDetails = async (btn) => {
      const id = btn.getAttribute('data-id');
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const localReg = (!isNaN(idx) && registrations[idx]) ? registrations[idx] : registrations.find(r => String(r._id) === String(id) || String(r.registrationId) === String(id));

      if (localReg) {
        openRegistrationDetailsModal(localReg);
      }

      const token = state.token || localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
      try {
        const res = await fetch(`${API_BASE}/api/registrations/details/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.registration) {
            openRegistrationDetailsModal(data.registration, data.formSchema);
          }
        }
      } catch (err) {
        console.warn('Could not fetch server registration details:', err);
      }
    };

    document.querySelectorAll('.view-reg-btn').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleViewDetails(this);
      };
    });

  } catch (error) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('registrations', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Registration Management', false)}
          <main class="content-body"><div class="alert alert-danger">${error.message}</div></main>
        </div>
      </div>
    `;
  }
}

/**
 * Open Participant Registration Details Modal
 */
function openRegistrationDetailsModal(reg, formSchema = []) {
  const modal = document.getElementById('reg-details-modal');
  const title = document.getElementById('reg-modal-title');
  const content = document.getElementById('reg-modal-content');
  if (!modal || !content) return;

  const pName = reg.fullName || reg.participantName || reg.formData?.['Full Name'] || reg.formData?.['name'] || 'Participant';
  const pEmail = reg.email || reg.participantEmail || reg.formData?.['Email'] || reg.formData?.['email'] || 'N/A';
  const pPhone = reg.phone || reg.participantPhone || reg.formData?.['Phone Number'] || reg.formData?.['mobile'] || 'N/A';
  const eventTitle = reg.eventId?.title || reg.eventTitle || 'Assigned Event';
  const regId = reg.registrationId || reg._id || 'N/A';
  const regDate = reg.registeredAt ? formatISTDateTime(reg.registeredAt) : 'N/A';

  const attendedTime = formatISTTime(reg.attendedAt, reg.attendedTime, reg.attendedDate);
  const kitTime = formatISTTime(reg.kitIssuedAt, reg.kitIssuedTime, reg.kitIssuedDate);
  const foodTime = formatISTTime(reg.foodRedeemedAt, reg.foodRedeemedTime, reg.foodRedeemedDate);

  const attendedStr = reg.attended ? `✅ Present (${attendedTime || 'Verified'})` : '❌ Absent';
  const kitStr = reg.kitIssued ? `✅ Issued (${kitTime || 'Issued'})` : '⏳ Not Issued';
  const foodStr = reg.foodRedeemed ? `✅ Redeemed (${foodTime || 'Redeemed'})` : (reg.couponIssued ? '🎟️ Coupon Issued' : '⏳ Pending');
  
  const appStatus = (reg.approvalStatus || 'PENDING').toUpperCase();
  const statusStr = appStatus === 'APPROVED' ? '✓ APPROVED' : (appStatus === 'REJECTED' ? '✕ REJECTED' : '⏳ PENDING APPROVAL');

  // Extract Form Data
  const formDataObj = reg.formData instanceof Map ? Object.fromEntries(reg.formData) : (reg.formData || {});

  // Build Dynamic Form Fields HTML
  const dynamicFieldsHTML = Object.entries(formDataObj).map(([key, value]) => {
    if (['registrationId', '_id', '__v'].includes(key)) return '';

    const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    const isImage = typeof value === 'string' && (
      value.startsWith('data:image/') || 
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(value)
    );

    const isDocument = typeof value === 'string' && (
      value.startsWith('http') || 
      /\.(pdf|doc|docx|zip|rar|csv|xlsx)(\?.*)?$/i.test(value)
    );

    let displayVal = value;
    if (isImage) {
      displayVal = `
        <div style="margin-top:6px;">
          <img src="${value}" alt="${formattedLabel}" style="max-width:180px; max-height:140px; border-radius:12px; border:1px solid #e2e8f0; object-fit:cover; display:block;" />
          <a href="${value}" target="_blank" style="font-size:11px; color:#4f46e5; font-weight:700; text-decoration:none; display:inline-block; margin-top:4px;">🔍 View Full Image ↗</a>
        </div>
      `;
    } else if (isDocument) {
      displayVal = `
        <div style="margin-top:6px;">
          <a href="${value}" target="_blank" style="background:#e0e7ff; color:#4338ca; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
            📄 Open / Download Document ↗
          </a>
        </div>
      `;
    } else if (Array.isArray(value)) {
      displayVal = value.map(v => `<span style="background:#f1f5f9; color:#334155; padding:2px 8px; border-radius:6px; font-size:12px; font-weight:700; margin-right:4px;">${v}</span>`).join('');
    } else if (typeof value === 'object' && value !== null) {
      displayVal = JSON.stringify(value);
    }

    return `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 16px; margin-bottom:10px;">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">${formattedLabel}</div>
        <div style="font-size:13.5px; font-weight:700; color:#0f172a;">${displayVal || 'N/A'}</div>
      </div>
    `;
  }).filter(Boolean).join('') || '<div style="font-size:13px; color:#94a3b8; font-style:italic;">No additional form fields submitted.</div>';

  if (title) title.textContent = `${pName} — Registration Details`;

  content.innerHTML = `
    <!-- Top Action / Reference Bar -->
    <div style="background:linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color:#ffffff; padding:18px 20px; border-radius:16px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; opacity:0.85;">REG REFERENCE ID</div>
        <div style="font-size:18px; font-weight:900; font-family:monospace; margin-top:2px;">${regId}</div>
      </div>
      <span style="background:rgba(255,255,255,0.2); padding:6px 14px; border-radius:20px; font-size:12px; font-weight:800;">
        ${statusStr}
      </span>
    </div>

    <!-- Section 1: Participant & Event Info -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px;">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">FULL NAME</div>
        <div style="font-size:14px; font-weight:800; color:#0f172a; margin-top:2px;">${pName}</div>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">EMAIL ADDRESS</div>
        <div style="font-size:13px; font-weight:700; color:#4338ca; margin-top:2px; word-break:break-all;">${pEmail}</div>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">PHONE NUMBER</div>
        <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-top:2px;">${pPhone}</div>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">ASSIGNED EVENT</div>
        <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-top:2px;">${eventTitle}</div>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; grid-column: span 2;">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">REGISTERED DATE & TIME</div>
        <div style="font-size:13.5px; font-weight:700; color:#0f172a; margin-top:2px;">${regDate}</div>
      </div>
    </div>

    <!-- Section 2: Event Check-in & Status Metrics -->
    <div style="margin-bottom:20px;">
      <div style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">STATUS & METRICS</div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
        <div style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:800; color:#64748b;">ENTRANCE</div>
          <div style="font-size:12px; font-weight:800; color:${reg.attended ? '#16a34a' : '#64748b'}; margin-top:4px;">${attendedStr}</div>
        </div>
        <div style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:800; color:#64748b;">WELCOME KIT</div>
          <div style="font-size:12px; font-weight:800; color:${reg.kitIssued ? '#16a34a' : '#64748b'}; margin-top:4px;">${kitStr}</div>
        </div>
        <div style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:800; color:#64748b;">FOOD COUPON</div>
          <div style="font-size:12px; font-weight:800; color:${reg.foodRedeemed ? '#ea580c' : '#64748b'}; margin-top:4px;">${foodStr}</div>
        </div>
      </div>
    </div>

    <!-- Section 3: Submitted Form Responses -->
    <div style="margin-bottom:20px;">
      <div style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">SUBMITTED FORM RESPONSES</div>
      ${dynamicFieldsHTML}
    </div>

    <!-- Footer Back Button -->
    <div style="margin-top:24px; text-align:right; border-top:1px solid #e2e8f0; padding-top:16px;">
      <button type="button" id="close-details-modal-btn" style="background:#f1f5f9; color:#475569; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer;">
        ← Back to Registrations List
      </button>
    </div>
  `;

  modal.style.display = 'flex';

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };

  const closeBtn1 = document.getElementById('close-details-modal-btn');
  if (closeBtn1) closeBtn1.onclick = () => { modal.style.display = 'none'; };

  const closeBtn2 = document.getElementById('reg-modal-close-btn');
  if (closeBtn2) closeBtn2.onclick = () => { modal.style.display = 'none'; };
}

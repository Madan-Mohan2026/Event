import { state, navigate } from '../app.js';
import { getEvents } from '../services/eventService.js';
import { getRegistrations, getAllRegistrations } from '../services/registrationService.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { showAlert, exportToExcelCSV, formatISTTime, formatISTDateTime, formatISTDate } from '../utils/helpers.js';
import { notifyKitIssued } from '../services/notificationService.js';

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
      const presentCount = eventRegs.filter(r => r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present').length;
      const absentCount = totalCount - presentCount;
      const confirmedCount = eventRegs.filter(r => (r.status || 'confirmed').toLowerCase() === 'confirmed').length;

      return `
        <div class="event-reg-card" data-event-id="${ev._id}" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:18px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.03); display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor:pointer;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <span style="background:#e0e7ff; color:#4338ca; font-size:11px; font-weight:800; padding:4px 10px; border-radius:10px; text-transform:uppercase; letter-spacing:0.5px;">
                ${ev.category || 'EVENT'}
              </span>
              <span style="font-size:11.5px; font-weight:800; color:#16a34a; background:#f0fdf4; padding:3px 10px; border-radius:12px; border:1px solid #bbf7d0;">
                ${confirmedCount} Confirmed
              </span>
            </div>

            <h3 style="font-size:19px; font-weight:800; color:#0f172a; margin:0 0 14px 0; line-height:1.3;">${ev.title || 'Untitled Event'}</h3>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:14px 16px; margin-bottom:18px;">
              <div style="font-size:26px; font-weight:900; color:#4f46e5; line-height:1.2;">
                ${totalCount} <span style="font-size:13.5px; font-weight:700; color:#64748b;">Registrations</span>
              </div>
              <div style="display:flex; align-items:center; gap:14px; margin-top:8px; font-size:13px; font-weight:700;">
                <span style="color:#16a34a; display:inline-flex; align-items:center; gap:5px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:#22c55e;"></span> ${presentCount} Present
                </span>
                <span style="color:#64748b; display:inline-flex; align-items:center; gap:5px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:#94a3b8;"></span> ${absentCount} Absent
                </span>
              </div>
            </div>
          </div>

          <button type="button" class="view-event-regs-btn" data-event-id="${ev._id}" style="width:100%; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#ffffff; border:none; padding:12px 16px; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 14px rgba(99,102,241,0.3);">
            <span>View Registrations</span>
            <span>→</span>
          </button>
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
          <p style="font-size: 13px; color: #64748b;">Select an event card below to review and manage its participant registrations.</p>
        </div>
        <button id="reg-export-all-btn" class="btn btn-primary" style="background-color:#10b981; border:none; padding:10px 20px; border-radius:10px; font-weight:700; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
          📊 Download All Registrations
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px;">
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
 * 2. EVENT-SPECIFIC REGISTRATIONS VIEW (Table View for Selected Event)
 */
export async function renderEventSpecificRegistrations(eventId, filterState = {}) {
  try {
    // Standardize filter options
    const filters = typeof filterState === 'string'
      ? { search: filterState, dateFilter: 'all', customFrom: '', customTo: '', attendanceFilter: 'all', foodFilter: 'all' }
      : {
          search: filterState.search || '',
          dateFilter: filterState.dateFilter || 'all',
          customFrom: filterState.customFrom || '',
          customTo: filterState.customTo || '',
          attendanceFilter: filterState.attendanceFilter || 'all',
          foodFilter: filterState.foodFilter || 'all'
        };

    const [rawEvents, rawData] = await Promise.all([
      getEvents(),
      getRegistrations(eventId).catch(() => getAllRegistrations())
    ]);

    const events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);
    const selectedEvent = events.find(e => String(e._id) === String(eventId)) || { _id: eventId, title: 'Event' };

    const rawRegs = rawData.registrations || (Array.isArray(rawData) ? rawData : []);
    const totalEventRegistrations = rawRegs.filter(r => isRegistrationForEvent(r, selectedEvent));
    const totalCount = totalEventRegistrations.length;

    let registrations = [...totalEventRegistrations];

    // 1. Search Filter
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

    // 2. Attendance Filter
    if (filters.attendanceFilter === 'present') {
      registrations = registrations.filter(r => r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present');
    } else if (filters.attendanceFilter === 'absent') {
      registrations = registrations.filter(r => !(r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present'));
    }

    // 3. Food Status Filter
    if (filters.foodFilter === 'issued' || filters.foodFilter === 'taken') {
      registrations = registrations.filter(r => r.foodRedeemed === true || r.foodIssued === true || r.foodTaken === true);
    } else if (filters.foodFilter === 'not_issued' || filters.foodFilter === 'not_taken') {
      registrations = registrations.filter(r => !(r.foodRedeemed === true || r.foodIssued === true || r.foodTaken === true));
    }

    // 4. Date Filter
    if (filters.dateFilter !== 'all') {
      const now = new Date();

      registrations = registrations.filter(r => {
        const dStr = r.registeredAt || r.createdAt || r.appliedAt;
        if (!dStr) return false;
        const rDate = new Date(dStr);
        if (isNaN(rDate.getTime())) return false;

        if (filters.dateFilter === 'today') {
          return rDate.getFullYear() === now.getFullYear() &&
                 rDate.getMonth() === now.getMonth() &&
                 rDate.getDate() === now.getDate();
        }

        if (filters.dateFilter === 'yesterday') {
          const yest = new Date(now);
          yest.setDate(now.getDate() - 1);
          return rDate.getFullYear() === yest.getFullYear() &&
                 rDate.getMonth() === yest.getMonth() &&
                 rDate.getDate() === yest.getDate();
        }

        if (filters.dateFilter === 'this_week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return rDate >= startOfWeek && rDate < endOfWeek;
        }

        if (filters.dateFilter === 'this_month') {
          return rDate.getFullYear() === now.getFullYear() &&
                 rDate.getMonth() === now.getMonth();
        }

        if (filters.dateFilter === 'custom') {
          if (filters.customFrom) {
            const fromD = new Date(filters.customFrom + 'T00:00:00');
            if (rDate < fromD) return false;
          }
          if (filters.customTo) {
            const toD = new Date(filters.customTo + 'T23:59:59');
            if (rDate > toD) return false;
          }
          return true;
        }

        return true;
      });
    }

    const isFiltered = Boolean(sTerm || filters.dateFilter !== 'all' || filters.attendanceFilter !== 'all' || filters.foodFilter !== 'all');
    const badgeText = isFiltered
      ? `Showing ${registrations.length} of ${totalCount} Registrations`
      : `${totalCount} Total Registrations`;

    const tableRows = registrations.length > 0 ? registrations.map((r, idx) => {
      const name = r.fullName || r.participantName || r.formData?.['Full Name'] || r.formData?.['name'] || r.formData?.['Name'] || 'Participant';
      const email = r.email || r.participantEmail || r.formData?.['Email'] || r.formData?.['email'] || 'N/A';
      const isAttended = r.attended === true || r.attendanceMarked === true || String(r.checkInStatus).toLowerCase() === 'present';
      const isKitIssued = r.kitIssued === true;
      const isFoodIssued = r.foodRedeemed === true || r.foodIssued === true || r.foodTaken === true;
      const appliedDate = r.registeredAt ? formatISTDate(r.registeredAt) : 'Today';
      const eventTitle = r.eventId?.title || r.eventTitle || selectedEvent.title || 'Assigned Event';

      const regId = r._id;

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 14px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${name}</div>
            <div style="font-size: 12px; color: #64748b;">${email}</div>
          </td>
          <td style="padding: 14px;">
            <span style="font-size: 12px; font-weight: 600; color: #4338ca; background: #eef2ff; padding: 4px 10px; border-radius: 12px;">${eventTitle}</span>
          </td>
          <td style="padding: 14px;">
            <span class="badge ${isAttended ? 'badge-published' : 'badge-draft'}">${isAttended ? 'Present' : 'Absent'}</span>
          </td>
          <td style="padding: 14px;">
            <button class="kit-toggle-btn badge" data-id="${regId}" data-issued="${isKitIssued}" style="cursor:pointer; border:none; background:${isKitIssued ? '#dcfce7' : '#f1f5f9'}; color:${isKitIssued ? '#15803d' : '#64748b'}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">
              ${isKitIssued ? '✓ Issued' : 'Mark Issued'}
            </button>
          </td>
          <td style="padding: 14px;">
            <span class="badge" style="background:${isFoodIssued ? '#dcfce7' : '#f1f5f9'}; color:${isFoodIssued ? '#15803d' : '#64748b'}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              ${isFoodIssued ? '✓ Issued' : 'Not Issued'}
            </span>
          </td>
          <td style="padding: 14px;">
            <span class="badge badge-published">Confirmed</span>
          </td>
          <td style="padding: 14px; font-size: 12px; color: #64748b; font-weight: 600;">${appliedDate}</td>
          <td style="padding: 14px;">
            <button class="btn btn-sm btn-outline view-reg-btn" data-id="${regId}" data-idx="${idx}" style="cursor:pointer; font-weight:700; border-radius:8px;">View Details</button>
          </td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 600;">
          No registration records match the active criteria for ${selectedEvent.title}.
        </td>
      </tr>
    `;

    const html = `
      <!-- Professional Participant Details Modal -->
      <div id="reg-details-modal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#ffffff; border-radius:24px; padding:32px 28px; max-width:640px; width:100%; max-height:88vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
            <h3 style="font-size:19px; font-weight:900; color:#0f172a; margin:0;" id="reg-modal-title">Participant Registration Details</h3>
            <button id="reg-modal-close-btn" style="border:none; background:#f1f5f9; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; color:#64748b; display:inline-flex; align-items:center; justify-content:center;">✕</button>
          </div>
          <div id="reg-modal-content"></div>
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
              <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin:0;">${selectedEvent.title} REGISTRATIONS</h2>
              <span style="background:#eef2ff; color:#4338ca; font-size:12px; font-weight:800; padding:4px 12px; border-radius:12px;">
                ${badgeText}
              </span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin:4px 0 0;">Review attendance, kit issuance, food status, and participant details.</p>
          </div>
          <button id="reg-export-btn" class="btn btn-primary" style="background-color:#10b981; border:none; padding:9px 20px; border-radius:10px; font-weight:700; font-size:14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
            📊 Download Excel
          </button>
        </div>
      </div>

      <!-- Search & Filters Bar -->
      <div class="card" style="padding: 18px 22px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Top Row: Search Input -->
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="position: relative; flex: 1; min-width: 260px;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 14px;">🔍</span>
              <input type="text" id="reg-search-input" class="form-control" placeholder="Search name, email, phone, reg ID..." value="${filters.search}" style="padding-left: 38px; height: 42px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13.5px; font-weight: 500; width: 100%;">
            </div>
          </div>

          <!-- Bottom Row: Filters & Action Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 14px;">
            <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
              <!-- Date Filter -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Date:</label>
                <select id="reg-date-filter" style="height: 38px; padding: 0 32px 0 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; color: #1e293b; background: #ffffff url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2364748b\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>') no-repeat right 10px center; appearance: none; cursor: pointer;">
                  <option value="all" ${filters.dateFilter === 'all' ? 'selected' : ''}>All Dates</option>
                  <option value="today" ${filters.dateFilter === 'today' ? 'selected' : ''}>Today</option>
                  <option value="yesterday" ${filters.dateFilter === 'yesterday' ? 'selected' : ''}>Yesterday</option>
                  <option value="this_week" ${filters.dateFilter === 'this_week' ? 'selected' : ''}>This Week</option>
                  <option value="this_month" ${filters.dateFilter === 'this_month' ? 'selected' : ''}>This Month</option>
                  <option value="custom" ${filters.dateFilter === 'custom' ? 'selected' : ''}>Custom Date</option>
                </select>
              </div>

              <!-- Custom Date Range -->
              <div id="custom-date-container" style="display: ${filters.dateFilter === 'custom' ? 'flex' : 'none'}; align-items: center; gap: 8px;">
                <input type="date" id="reg-from-date" value="${filters.customFrom}" style="height: 38px; padding: 0 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12.5px; font-weight: 600; color: #1e293b;">
                <span style="font-size: 12px; color: #64748b; font-weight: 700;">to</span>
                <input type="date" id="reg-to-date" value="${filters.customTo}" style="height: 38px; padding: 0 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12.5px; font-weight: 600; color: #1e293b;">
              </div>

              <!-- Attendance Filter -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Attendance:</label>
                <select id="reg-attendance-filter" style="height: 38px; padding: 0 32px 0 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; color: #1e293b; background: #ffffff url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2364748b\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>') no-repeat right 10px center; appearance: none; cursor: pointer;">
                  <option value="all" ${filters.attendanceFilter === 'all' ? 'selected' : ''}>All Attendance</option>
                  <option value="present" ${filters.attendanceFilter === 'present' ? 'selected' : ''}>Present</option>
                  <option value="absent" ${filters.attendanceFilter === 'absent' ? 'selected' : ''}>Absent</option>
                </select>
              </div>

              <!-- Food Status Filter -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Food:</label>
                <select id="reg-food-filter" style="height: 38px; padding: 0 32px 0 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; color: #1e293b; background: #ffffff url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2364748b\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>') no-repeat right 10px center; appearance: none; cursor: pointer;">
                  <option value="all" ${filters.foodFilter === 'all' ? 'selected' : ''}>All Food Status</option>
                  <option value="issued" ${filters.foodFilter === 'issued' || filters.foodFilter === 'taken' ? 'selected' : ''}>Issued</option>
                  <option value="not_issued" ${filters.foodFilter === 'not_issued' || filters.foodFilter === 'not_taken' ? 'selected' : ''}>Not Issued</option>
                </select>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
              <button id="reg-clear-filters-btn" style="height: 38px; padding: 0 16px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                ✕ Clear Filters
              </button>
              <button id="reg-apply-filters-btn" class="btn btn-primary" style="background-color: #4f46e5; height: 38px; padding: 0 22px; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="card" style="border-radius: 14px; border: 1px solid #e2e8f0; background: white; overflow: hidden;">
        <div class="table-responsive">
          <table class="table" style="width: 100%; margin-bottom: 0;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">APPLICANT</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">EVENT</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">ATTENDANCE</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">KIT</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">FOOD</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">STATUS</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">APPLIED</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">ACTIONS</th>
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

    // Event listeners
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

    // Date filter dropdown change listener (toggle custom date range visibility)
    document.getElementById('reg-date-filter')?.addEventListener('change', (e) => {
      const customContainer = document.getElementById('custom-date-container');
      if (customContainer) {
        customContainer.style.display = e.target.value === 'custom' ? 'flex' : 'none';
      }
    });

    const applyFilters = () => {
      const search = document.getElementById('reg-search-input')?.value || '';
      const dateFilter = document.getElementById('reg-date-filter')?.value || 'all';
      const customFrom = document.getElementById('reg-from-date')?.value || '';
      const customTo = document.getElementById('reg-to-date')?.value || '';
      const attendanceFilter = document.getElementById('reg-attendance-filter')?.value || 'all';
      const foodFilter = document.getElementById('reg-food-filter')?.value || 'all';

      renderEventSpecificRegistrations(eventId, { search, dateFilter, customFrom, customTo, attendanceFilter, foodFilter });
    };

    const clearFilters = () => {
      renderEventSpecificRegistrations(eventId, { search: '', dateFilter: 'all', customFrom: '', customTo: '', attendanceFilter: 'all', foodFilter: 'all' });
    };

    document.getElementById('reg-apply-filters-btn')?.addEventListener('click', applyFilters);
    document.getElementById('reg-clear-filters-btn')?.addEventListener('click', clearFilters);
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

    // Kit toggle buttons
    document.querySelectorAll('.kit-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const currentlyIssued = this.getAttribute('data-issued') === 'true';
        const newValue = !currentlyIssued;
        const token = state.token || localStorage.getItem('admin_token');
        try {
          const res = await fetch(`${API_BASE}/api/registrations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ kitIssued: newValue })
          });
          if (res.ok) {
            this.setAttribute('data-issued', String(newValue));
            this.textContent = newValue ? '✓ Issued' : 'Mark Issued';
            this.style.background = newValue ? '#dcfce7' : '#f1f5f9';
            this.style.color = newValue ? '#15803d' : '#64748b';
            if (newValue) {
              notifyKitIssued('Participant');
            }
          }
        } catch (err) {
          console.error('Failed to update kit status:', err);
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
 * Open Rich Dynamic Participant Registration Details Modal
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
  const statusStr = reg.status || 'Confirmed';


  // Extract Form Data
  const formDataObj = reg.formData instanceof Map ? Object.fromEntries(reg.formData) : (reg.formData || {});

  // Build Dynamic Form Fields HTML
  const dynamicFieldsHTML = Object.entries(formDataObj).map(([key, value]) => {
    // Skip internal or duplicate basic keys
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
      <span style="background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:20px; font-size:12px; font-weight:800;">
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


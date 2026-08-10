import { state, navigate } from '../app.js';
import { getEvents } from '../services/eventService.js';
import { getRegistrations, getAllRegistrations } from '../services/registrationService.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { showAlert, exportToExcelCSV } from '../utils/helpers.js';
import { notifyKitIssued } from '../services/notificationService.js';
import { API_BASE } from '../utils/constants.js';

export async function renderRegistrations() {
  const hash = window.location.hash || '#registrations';
  const targetEventId = hash.split('/')[1] || 'all';
  return renderGeneralRegistrations({ eventId: targetEventId });
}

export async function renderGeneralRegistrations(activeFilters = {}) {
  try {
    const rawEvents = await getEvents();
    const events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);

    let rawData;
    if (activeFilters.eventId && activeFilters.eventId !== 'all') {
      rawData = await getRegistrations(activeFilters.eventId);
    } else {
      rawData = await getAllRegistrations();
    }

    let registrations = rawData.registrations || (Array.isArray(rawData) ? rawData : []);
    const totalRegistrations = rawData.totalRegistrations || registrations.length;

    // Filter by search term if active
    const searchTerm = (activeFilters.search || '').trim().toLowerCase();
    if (searchTerm) {
      registrations = registrations.filter(r => {
        const name = (r.fullName || r.participantName || r.formData?.['Full Name'] || r.formData?.['name'] || '').toLowerCase();
        const email = (r.email || r.participantEmail || r.formData?.['Email'] || r.formData?.['email'] || '').toLowerCase();
        const phone = (r.phone || r.participantPhone || r.formData?.['Phone Number'] || r.formData?.['mobile'] || '').toLowerCase();
        const regId = (r.registrationId || r._id || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || regId.includes(searchTerm);
      });
    }

    const eventOptions = events.map(e => `
      <option value="${e._id}" ${activeFilters.eventId === e._id ? 'selected' : ''}>${e.title}</option>
    `).join('');

    const tableRows = registrations.length > 0 ? registrations.map((r, idx) => {
      const name = r.fullName || r.participantName || r.formData?.['Full Name'] || r.formData?.['name'] || r.formData?.['Name'] || 'Participant';
      const email = r.email || r.participantEmail || r.formData?.['Email'] || r.formData?.['email'] || 'N/A';
      const foodPref = (r.formData?.['Food Preference'] || r.formData?.['food'] || 'VEG').toUpperCase();
      const isAttended = r.attended === true;
      const isKitIssued = r.kitIssued === true;
      const appliedDate = r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
      const eventTitle = r.eventId?.title || r.eventTitle || 'Assigned Event';
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
            <span class="badge ${foodPref.includes('NON') ? 'badge-draft' : 'badge-published'}">${foodPref}</span>
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
          No registration records match the criteria.
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

      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Registration Management</h2>
          <p style="font-size: 13px; color: #64748b;">Review event registrations, food preferences, check-in status, and exports.</p>
        </div>
        <div style="display:flex; gap: 10px;">
          <button id="reg-export-btn" class="btn btn-primary" style="background-color:#10b981; border:none; padding:8px 18px; border-radius:8px; font-weight:700; display:flex; align-items:center; gap:6px; cursor:pointer;">
            📊 Download Excel
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 320px)); gap: 20px; margin-bottom: 24px;">
        <div class="card" style="padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: white;">
          <div style="width: 42px; height: 42px; border-radius: 10px; background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 12px;">📥</div>
          <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Total Registrations</div>
          <div style="font-size: 28px; font-weight: 800; color: #0f172a;">${registrations.length} <small style="font-size:13px; color:#64748b; font-weight:500;">(${totalRegistrations} total)</small></div>
        </div>
      </div>

      <div class="card" style="padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; margin-bottom: 24px;">
        <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
          <div style="position: relative; flex: 1; min-width: 220px;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 14px;">🔍</span>
            <input type="text" id="reg-search-input" class="form-control" placeholder="Search name, email, phone, reg ID..." value="${activeFilters?.search || ''}" style="padding-left: 36px; height: 38px; border-radius: 8px;">
          </div>
          <select id="reg-filter-event" class="form-control" style="width: 160px; height: 38px; border-radius: 8px;">
            <option value="all" ${!activeFilters?.eventId || activeFilters.eventId === 'all' ? 'selected' : ''}>All Events</option>
            ${eventOptions}
          </select>
          <button id="reg-apply-filters-btn" class="btn btn-primary" style="background-color:#4f46e5; height: 38px; padding: 0 20px; border-radius: 8px; font-weight: 600; border: none; cursor:pointer;">
            Apply Filters
          </button>
        </div>
      </div>

      <div class="card" style="border-radius: 12px; border: 1px solid #e2e8f0; background: white; overflow: hidden;">
        <div class="table-responsive">
          <table class="table" style="width: 100%; margin-bottom: 0;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">APPLICANT</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">EVENT</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">FOOD PREF</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">ATTENDANCE</th>
                <th style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">KIT</th>
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

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('#login');
    });

    document.getElementById('reg-export-btn')?.addEventListener('click', () => {
      exportToExcelCSV(registrations, 'Registrations_Report.csv');
    });

    document.getElementById('reg-filter-event')?.addEventListener('change', (e) => {
      const searchVal = document.getElementById('reg-search-input')?.value || '';
      renderGeneralRegistrations({ eventId: e.target.value, search: searchVal });
    });

    const triggerFilter = () => {
      const selectedEvId = document.getElementById('reg-filter-event')?.value || 'all';
      const searchVal = document.getElementById('reg-search-input')?.value || '';
      renderGeneralRegistrations({ eventId: selectedEvId, search: searchVal });
    };

    document.getElementById('reg-apply-filters-btn')?.addEventListener('click', triggerFilter);
    document.getElementById('reg-search-input')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') triggerFilter();
    });

    // View Details button handler
    document.querySelectorAll('.view-reg-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const token = state.token || localStorage.getItem('admin_token');
        try {
          const res = await fetch(`${API_BASE}/api/registrations/details/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && data.registration) {
            openRegistrationDetailsModal(data.registration, data.formSchema);
          } else {
            const localReg = registrations.find(r => r._id === id || r.registrationId === id);
            if (localReg) {
              openRegistrationDetailsModal(localReg);
            } else {
              showAlert(data.error || 'Failed to load participant registration details from database.', 'danger');
            }
          }
        } catch (err) {
          const localReg = registrations.find(r => r._id === id || r.registrationId === id);
          if (localReg) {
            openRegistrationDetailsModal(localReg);
          } else {
            showAlert('Network error while loading participant details.', 'danger');
          }
        }
      });
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

  const regDate = reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
  const attendedStr = reg.attended ? `✅ Present (${reg.attendedTime || reg.attendedDate || 'Verified'})` : '❌ Absent';
  const kitStr = reg.kitIssued ? `✅ Issued (${reg.kitIssuedTime || reg.kitIssuedDate || 'Issued'})` : '⏳ Not Issued';
  const foodStr = reg.foodRedeemed ? `✅ Redeemed (${reg.foodRedeemedTime || reg.foodRedeemedDate || 'Redeemed'})` : (reg.couponIssued ? '🎟️ Coupon Issued' : '⏳ Pending');
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

  document.getElementById('close-details-modal-btn')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  document.getElementById('reg-modal-close-btn')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

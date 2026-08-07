import { state } from '../app.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { renderAdminPortalLayout } from './AdminDashboard.js';
import { showAlert } from '../utils/helpers.js';
import { apiFetch } from '../services/api.js';
import { getEvents } from '../services/eventService.js';

export async function renderManualAttendance() {
  const app = document.getElementById('app');

  try {
    let events = [];
    try {
      events = await getEvents();
    } catch (err) {
      console.warn('Failed to fetch events via getEvents(), using state fallback:', err);
    }

    const currentUser = state.user || {};
    const isEventAdmin = currentUser.role === 'admin';

    // Filter events assigned to the current Event Admin
    let availableEvents = events;
    if (isEventAdmin) {
      if (currentUser.assignedEventIds && currentUser.assignedEventIds.length > 0) {
        availableEvents = events.filter(e => currentUser.assignedEventIds.includes(String(e._id)));
      } else if (currentUser.assignedEventId) {
        availableEvents = events.filter(e => String(e._id) === String(currentUser.assignedEventId));
      }
      if (availableEvents.length === 0 && state.currentEvent) {
        availableEvents = [state.currentEvent];
      }
    }

    const defaultEventId = availableEvents.length > 0 ? String(availableEvents[0]._id) : '';

    const contentHTML = `
      <main class="page-body" style="padding: 10px 8px; max-width: 700px; margin: 0 auto;">
        
        <!-- Search Form Card -->
        <div style="background: #ffffff; border-radius: 16px; padding: 16px 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 12px; border: 1px solid #e2e8f0;">
          
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
            <span style="font-size: 18px; background: #e0e7ff; color: #4338ca; width: 34px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">📋</span>
            <div>
              <h1 style="font-size: 17px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">Manual Attendance</h1>
              <p style="font-size: 11.5px; color: #64748b; margin-top: 1px; margin-bottom: 0;">Search participant by mobile number & mark attendance.</p>
            </div>
          </div>

          <form id="manual-attendance-search-form">
            
            <!-- Section 1 – Select Event -->
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 11.5px; font-weight: 800; color: #334155; margin-bottom: 4px;">
                Select Event <span style="color: #ef4444;">*</span>
              </label>
              <select id="manual-event-select" class="form-control" style="width: 100%; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 9px 12px; font-size: 13px; font-weight: 700; background: #fff; color: #0f172a;" ${availableEvents.length === 1 ? 'disabled' : ''}>
                ${availableEvents.length > 0
                  ? availableEvents.map(e => `<option value="${e._id}" ${String(e._id) === defaultEventId ? 'selected' : ''}>${e.title} (${e.eventCode || 'EVT'})</option>`).join('')
                  : '<option value="">No Assigned Events Available</option>'
                }
              </select>
            </div>

            <!-- Section 2 – Search by Mobile Number -->
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 11.5px; font-weight: 800; color: #334155; margin-bottom: 4px;">
                Registered Mobile Number <span style="color: #ef4444;">*</span>
              </label>
              <div style="display: flex; align-items: center; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #eff6ff;">
                <span style="padding: 9px 12px; background: #eff6ff; color: #475569; font-weight: 800; font-size: 13px; border-right: 1.5px solid #cbd5e1; flex-shrink: 0;">+91</span>
                <input type="text" id="manual-mobile-input" placeholder="Enter 10-digit mobile number" maxlength="10" required style="flex: 1; min-width: 0; border: none; padding: 9px 12px; font-size: 14px; font-weight: 700; outline: none; background: #eff6ff; color: #0f172a;" />
              </div>
            </div>

            <!-- Alert Box Container -->
            <div id="manual-search-alert" style="margin-bottom: 10px;"></div>

            <!-- Search Button -->
            <button type="submit" id="manual-search-btn" class="btn btn-primary" style="width: 100%; background: #4f46e5; color: #ffffff; border: none; padding: 11px; border-radius: 8px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 10px rgba(79,70,229,0.25); display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>🔍 Search Participant</span>
            </button>
          </form>
        </div>

        <!-- Section 3 & 4 – Participant Details & Mark Attendance Container -->
        <div id="participant-result-container"></div>

      </main>
    `;

    if (isEventAdmin) {
      renderAdminPortalLayout('manual-attendance', 'Manual Attendance', contentHTML);
    } else {
      app.innerHTML = `
        <div class="app-layout">
          ${renderSidebar('manual-attendance')}
          <div class="main-content">
            ${renderHeader('Manual Attendance', false)}
            ${contentHTML}
          </div>
        </div>
      `;
    }

    const searchForm = document.getElementById('manual-attendance-search-form');
    const mobileInput = document.getElementById('manual-mobile-input');
    const eventSelect = document.getElementById('manual-event-select');
    const alertBox = document.getElementById('manual-search-alert');
    const resultContainer = document.getElementById('participant-result-container');

    mobileInput?.focus();

    searchForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawMobile = mobileInput.value.trim();
      const cleanMobile = rawMobile.replace(/[^0-9]/g, '').slice(-10);
      const eventId = eventSelect.value;

      if (!eventId) {
        alertBox.innerHTML = `<div class="alert alert-danger" style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:9px 12px; border-radius:8px; font-weight:700; font-size:12.5px;">⚠️ Please select an event.</div>`;
        return;
      }
      if (!cleanMobile || cleanMobile.length < 10) {
        alertBox.innerHTML = `<div class="alert alert-danger" style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:9px 12px; border-radius:8px; font-weight:700; font-size:12.5px;">⚠️ Please enter a valid 10-digit mobile number.</div>`;
        return;
      }

      alertBox.innerHTML = '';
      resultContainer.innerHTML = `
        <div style="text-align:center; padding:24px 14px; background:#fff; border-radius:16px; border:1px solid #e2e8f0;">
          <div class="spinner-border text-primary" role="status" style="width:2.2rem; height:2.2rem; color:#4f46e5;"></div>
          <p style="margin-top:10px; font-weight:700; color:#475569; font-size:12.5px;">Searching participant records...</p>
        </div>
      `;

      try {
        const response = await apiFetch('/api/registrations/manual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNumber: cleanMobile, eventId })
        });
        const data = await response.json();

        if (!response.ok) {
          resultContainer.innerHTML = '';
          alertBox.innerHTML = `
            <div style="background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px; padding:10px 12px; color:#991b1b; font-weight:700; font-size:12.5px; display:flex; align-items:center; gap:6px;">
              <span style="font-size:16px;">⚠️</span>
              <div>${data.error || 'No participant found with this mobile number.'}</div>
            </div>
          `;
          return;
        }

        const p = data.participant;

        // Duplicate Protection Screen (If already marked)
        if (data.alreadyMarked) {
          resultContainer.innerHTML = `
            <div style="background:#ffffff; border-radius:16px; padding:16px 14px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1.5px solid #fed7aa;">
              
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:10px; gap:8px;">
                <div>
                  <span style="background:#ffedd5; color:#c2410c; padding:2px 8px; border-radius:12px; font-weight:800; font-size:10.5px; text-transform:uppercase; letter-spacing:0.5px;">Already Marked</span>
                  <h2 style="font-size:17px; font-weight:900; color:#0f172a; margin:4px 0 2px 0;">${p.name}</h2>
                  <div style="font-size:11.5px; font-weight:700; color:#64748b;">Registration ID: <span style="color:#4338ca; word-break:break-all;">${p.registrationId}</span></div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                  <span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:12px; font-weight:800; font-size:11px; white-space:nowrap;">✓ Approved</span>
                </div>
              </div>

              <!-- Duplicate Attendance Warning Box -->
              <div style="background:#fff7ed; border:1.5px solid #fed7aa; border-radius:12px; padding:12px; text-align:left;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                  <span style="font-size:16px;">⚠️</span>
                  <div style="font-size:13px; font-weight:900; color:#c2410c;">Attendance Already Marked</div>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#431407; font-weight:700;">
                  <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #fed7aa; padding-bottom:3px;">
                    <span style="color:#9a3412;">Method:</span>
                    <span style="background:#ffedd5; color:#c2410c; padding:1px 6px; border-radius:4px; font-weight:800;">${p.attendanceMethod === 'Manual' ? '📋 Manual' : '📱 QR Scan'}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #fed7aa; padding-bottom:3px;">
                    <span style="color:#9a3412;">Time:</span>
                    <span>${p.attendedTime || 'N/A'}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #fed7aa; padding-bottom:3px;">
                    <span style="color:#9a3412;">Date:</span>
                    <span>${p.attendedDate || 'Today'}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:#9a3412;">Marked By:</span>
                    <span>${p.attendedBy || 'Admin'}</span>
                  </div>
                </div>
              </div>

            </div>
          `;
          setTimeout(() => resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
          return;
        }

        // Fresh Participant Card Ready to Mark
        resultContainer.innerHTML = `
          <div style="background:#ffffff; border-radius:16px; padding:16px 14px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1.5px solid #bbf7d0;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:8px; gap:8px; flex-wrap:wrap;">
              <div>
                <span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:12px; font-weight:800; font-size:10.5px; text-transform:uppercase; letter-spacing:0.5px; display:inline-block; margin-bottom:3px;">Participant Details</span>
                <h2 style="font-size:18px; font-weight:900; color:#0f172a; margin:0 0 2px 0;">${p.name}</h2>
                <div style="font-size:11.5px; font-weight:700; color:#64748b;">Registration ID: <span style="color:#4338ca; word-break:break-all;">${p.registrationId}</span></div>
              </div>
              <div style="flex-shrink:0;">
                <span style="background:#dcfce7; color:#15803d; padding:3px 10px; border-radius:12px; font-weight:800; font-size:11px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;">✓ Approved</span>
              </div>
            </div>

            <!-- Compact Details List -->
            <div style="background:#f8fafc; padding:10px 12px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:12px; display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #edf2f7; padding-bottom:3px; gap:8px;">
                <span style="font-size:11.5px; font-weight:700; color:#64748b; flex-shrink:0;">Mobile</span>
                <span style="font-size:12.5px; font-weight:800; color:#0f172a;">+91 ${p.phone}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #edf2f7; padding-bottom:3px; gap:8px;">
                <span style="font-size:11.5px; font-weight:700; color:#64748b; flex-shrink:0;">Email</span>
                <span style="font-size:12.5px; font-weight:800; color:#0f172a; word-break:break-all; text-align:right;">${p.email || 'N/A'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #edf2f7; padding-bottom:3px; gap:8px;">
                <span style="font-size:11.5px; font-weight:700; color:#64748b; flex-shrink:0;">Event</span>
                <span style="font-size:12.5px; font-weight:800; color:#0f172a; text-align:right;">${p.eventTitle}</span>
              </div>
              <div style="display:flex; justify-content:space-between; gap:8px;">
                <span style="font-size:11.5px; font-weight:700; color:#64748b; flex-shrink:0;">Attendance</span>
                <span style="font-size:12.5px; font-weight:800; color:#ea580c;">Not Marked</span>
              </div>
            </div>

            <!-- Section 4 – Mark Attendance Button -->
            <button id="confirm-mark-btn" class="btn btn-success" style="width:100%; background:#10b981; color:#ffffff; border:none; padding:12px; border-radius:10px; font-size:14.5px; font-weight:800; cursor:pointer; box-shadow:0 3px 10px rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; gap:6px;">
              <span>✓ Mark Attendance</span>
            </button>

          </div>
        `;
        
        // Auto scroll into view smoothly so Mark Attendance button is fully visible
        setTimeout(() => {
          resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);

        document.getElementById('confirm-mark-btn')?.addEventListener('click', async () => {
          const markBtn = document.getElementById('confirm-mark-btn');
          markBtn.disabled = true;
          markBtn.innerHTML = `Marking Attendance...`;

          try {
            const checkinRes = await apiFetch('/api/registrations/manual-checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ registrationId: p.id, eventId: p.eventId })
            });
            const checkinData = await checkinRes.json();

            if (checkinRes.ok && checkinData.success) {
              showAlert('✅ Attendance marked successfully!', 'success');

              // Ultra Neatly Designed Mobile Success Card
              resultContainer.innerHTML = `
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 18px 14px; text-align: center; border: 1.5px solid #86efac; box-shadow: 0 6px 20px rgba(16,185,129,0.12);">
                  
                  <div style="width: 44px; height: 44px; background: #10b981; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; box-shadow: 0 4px 10px rgba(16,185,129,0.35); margin-bottom: 8px;">✓</div>

                  <h2 style="font-size: 18px; font-weight: 900; color: #065f46; margin: 0 0 4px 0;">Attendance Marked Successfully</h2>
                  <div style="font-size: 13px; font-weight: 800; color: #047857; margin-bottom: 12px;">
                    Participant: <span style="color: #0f172a; background: #ffffff; padding: 2px 8px; border-radius: 16px; border: 1px solid #a7f3d0; display: inline-block; margin-top: 2px;">${p.name}</span>
                  </div>

                  <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 12px; text-align: left; box-shadow: 0 2px 6px rgba(0,0,0,0.02); max-width: 500px; margin: 0 auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f0fdf4; gap: 6px;">
                      <span style="font-size: 11.5px; font-weight: 700; color: #64748b; flex-shrink: 0;">Registration ID</span>
                      <span style="font-size: 12px; font-weight: 800; color: #4338ca; background: #e0e7ff; padding: 2px 6px; border-radius: 4px; word-break: break-all;">${p.registrationId}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f0fdf4; gap: 6px;">
                      <span style="font-size: 11.5px; font-weight: 700; color: #64748b; flex-shrink: 0;">Attendance Method</span>
                      <span style="font-size: 11px; font-weight: 800; color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px; border: 1px solid #86efac;">📋 Manual</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f0fdf4; gap: 6px;">
                      <span style="font-size: 11.5px; font-weight: 700; color: #64748b; flex-shrink: 0;">Marked By</span>
                      <span style="font-size: 12px; font-weight: 800; color: #0f172a;">${checkinData.participant?.attendedBy || 'Admin'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f0fdf4; gap: 6px;">
                      <span style="font-size: 11.5px; font-weight: 700; color: #64748b; flex-shrink: 0;">Time</span>
                      <span style="font-size: 12px; font-weight: 800; color: #0f172a;">${checkinData.participant?.attendedTime || 'Just Now'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; gap: 6px;">
                      <span style="font-size: 11.5px; font-weight: 700; color: #64748b; flex-shrink: 0;">Date</span>
                      <span style="font-size: 12px; font-weight: 800; color: #0f172a;">${checkinData.participant?.attendedDate || 'Today'}</span>
                    </div>

                  </div>

                  <button id="search-another-btn" style="margin-top: 12px; width: 100%; max-width: 500px; background: #047857; color: #ffffff; border: none; padding: 11px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 10px rgba(4,120,87,0.25); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <span>🔄 Search Another Participant</span>
                  </button>

                </div>
              `;

              setTimeout(() => resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);

              document.getElementById('search-another-btn')?.addEventListener('click', () => {
                resultContainer.innerHTML = '';
                mobileInput.value = '';
                mobileInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });

            } else {
              showAlert(checkinData.error || 'Failed to mark attendance.', 'danger');
              markBtn.disabled = false;
              markBtn.innerHTML = `<span>✓ Mark Attendance</span>`;
            }
          } catch (err) {
            showAlert('Network error. Failed to mark attendance.', 'danger');
            markBtn.disabled = false;
            markBtn.innerHTML = `<span>✓ Mark Attendance</span>`;
          }
        });

      } catch (err) {
        resultContainer.innerHTML = '';
        alertBox.innerHTML = `<div class="alert alert-danger" style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:9px 12px; border-radius:8px; font-weight:700; font-size:12.5px;">⚠️ Network error. Please try again.</div>`;
      }
    });

  } catch (err) {
    showAlert('Error loading Manual Attendance view.', 'danger');
  }
}

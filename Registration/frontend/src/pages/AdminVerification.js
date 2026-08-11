import { state } from '../app.js';
import { apiFetch } from '../services/api.js';
import { getEvents, getEventById } from '../services/eventService.js';
import { renderAdminPortalLayout } from './AdminDashboard.js';

export async function renderAdminParticipantVerification() {
  let currentSearchType = 'phone';

  if (!state.currentEvent?.title) {
    const targetEventId = state.currentEvent?._id || localStorage.getItem('current_event_id') || state.user?.assignedEventId || state.user?.assignedEventIds?.[0];
    try {
      if (targetEventId) {
        const ev = await getEventById(targetEventId);
        if (ev && (ev.title || ev.name)) {
          state.currentEvent = { ...state.currentEvent, ...ev, title: ev.title || ev.name };
        }
      }
      if (!state.currentEvent?.title) {
        const events = await getEvents();
        if (Array.isArray(events) && events.length > 0) {
          const matched = events.find(e =>
            (targetEventId && String(e._id) === String(targetEventId)) ||
            (state.user?.assignedEventIds && state.user.assignedEventIds.includes(String(e._id))) ||
            (state.user?.assignedEventId && String(e._id) === String(state.user.assignedEventId))
          ) || events[0];
          if (matched) {
            state.currentEvent = { ...state.currentEvent, ...matched, title: matched.title || matched.name };
          }
        }
      }
    } catch (e) {
      console.warn('Failed loading assigned event details:', e);
    }
  }

  renderAdminPortalLayout('admin-verify', 'Participant Verification', `
    <div id="admin-verify-container" style="max-width:680px; width:100%; margin:0 auto; padding: 4px;"></div>
  `);

  const container = document.getElementById('admin-verify-container');
  if (!container) return;

  function renderSearchFormView(errorMessage = '') {
    const isPhone = currentSearchType === 'phone';
    const placeholder = isPhone ? 'Enter Phone Number' : 'Enter Registration ID (e.g. REG-1001)';
    const labelText = isPhone ? 'Registered Phone Number' : 'Registration Reference ID';

    container.innerHTML = `
      <div class="verify-card" style="background:#ffffff; border-radius:24px; padding:28px 20px; box-shadow:0 10px 30px rgba(0,0,0,0.06); border:1px solid #e2e8f0; text-align:center;">
        <div style="width:56px; height:56px; background:linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color:#ffffff; font-size:26px; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px;">🔍</div>
        <h1 style="font-size:20px; font-weight:900; color:#0f172a; margin-bottom:6px;">Participant Verification</h1>
        <p style="font-size:13px; color:#64748b; font-weight:600; margin-bottom:20px;">Quickly search a participant by mobile number or registration ID to view and manage event statuses.</p>

        <div class="verify-search-tabs" style="display:flex; background:#f1f5f9; padding:5px; border-radius:14px; margin-bottom:20px; gap:6px; flex-wrap:wrap;">
          <button type="button" id="tab-search-phone" style="flex:1; min-width:140px; padding:10px 12px; border:none; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer; ${isPhone ? 'background:#ffffff; color:#4f46e5; box-shadow:0 2px 8px rgba(0,0,0,0.08);' : 'background:transparent; color:#64748b;'}">
            📱 Search by Phone Number
          </button>
          <button type="button" id="tab-search-reg" style="flex:1; min-width:140px; padding:10px 12px; border:none; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer; ${!isPhone ? 'background:#ffffff; color:#4f46e5; box-shadow:0 2px 8px rgba(0,0,0,0.08);' : 'background:transparent; color:#64748b;'}">
            🪪 Search by Registration ID
          </button>
        </div>

        <form id="mobile-verify-search-form" style="text-align:left;">
          <div style="margin-bottom:20px;">
            <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:8px;">${labelText} *</label>
            <div style="display:flex; align-items:center; border:2px solid #cbd5e1; border-radius:14px; overflow:hidden; background:#ffffff;">
              ${isPhone ? `<span style="padding:14px 16px; background:#f8fafc; color:#475569; font-weight:800;">+91</span>` : `<span style="padding:14px 16px; background:#f8fafc; color:#475569;">🆔</span>`}
              <input type="text" id="verify-search-input" placeholder="${placeholder}" required style="flex:1; border:none; padding:14px 16px; font-size:15px; font-weight:700; outline:none;" />
            </div>
          </div>

          ${errorMessage ? `
            <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:16px; padding:16px; margin-bottom:20px; text-align:center;">
              <div style="color:#dc2626; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">
                <span>❌</span> No registration found with this mobile number for this event.
              </div>
            </div>
          ` : ''}

          <button type="submit" id="btn-submit-verify-search" style="width:100%; background:linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color:#ffffff; border:none; padding:15px; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer;">
            🔍 Search Participant
          </button>
        </form>
      </div>
    `;

    const input = document.getElementById('verify-search-input');
    input?.focus();

    document.getElementById('tab-search-phone')?.addEventListener('click', () => { currentSearchType = 'phone'; renderSearchFormView(); });
    document.getElementById('tab-search-reg')?.addEventListener('click', () => { currentSearchType = 'regId'; renderSearchFormView(); });

    document.getElementById('mobile-verify-search-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      await performParticipantLookup(val, currentSearchType);
    });
  }

  async function performParticipantLookup(queryVal, typeVal) {
    try {
      const res = await apiFetch('/api/registrations/verify-lookup', {
        method: 'POST',
        body: JSON.stringify({ query: queryVal, type: typeVal })
      });
      const data = await res.json();
      if (res.ok && data.success && data.participant) {
        renderParticipantDetailsView(data.participant);
      } else {
        renderSearchFormView(data.error || 'Participant Not Found.');
      }
    } catch (err) {
      renderSearchFormView('Network error while searching MongoDB.');
    }
  }

  function renderParticipantDetailsView(p) {
    const initials = p.name ? p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'P';
    const eventBadge = p.eventTitle || state.currentEvent?.title || 'Assigned Event';
    const phone = p.phone || p.mobile || 'N/A';
    const regId = p.registrationId || 'N/A';
    const email = p.email || 'N/A';
    
    const formatDateStr = (dStr) => {
      if (!dStr) return '';
      try {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
               ' at ' + 
               d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
      } catch {
        return dStr;
      }
    };

    const regDateStr = p.registeredDate ? formatDateStr(p.registeredDate) : (p.registeredAt ? formatDateStr(p.registeredAt) : '1 Aug 2026 at 06:01 pm');
    const attendedTimeStr = p.formattedAttendedTime || (p.attendedTime ? p.attendedTime : (p.attendedAt ? formatDateStr(p.attendedAt) : ''));
    const kitIssuedTimeStr = p.kitIssuedTime ? p.kitIssuedTime : (p.kitIssuedAt ? formatDateStr(p.kitIssuedAt) : '');
    const foodRedeemedTimeStr = p.foodRedeemedTime ? p.foodRedeemedTime : (p.foodRedeemedAt ? formatDateStr(p.foodRedeemedAt) : '');

    container.innerHTML = `
      <div class="verify-results-wrapper" style="max-width:680px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:16px; padding-bottom:40px;">
        
        <!-- 1. Participant Profile Card -->
        <div class="verify-card" style="background:#ffffff; border-radius:24px; padding:28px 24px; box-shadow:0 4px 20px rgba(0,0,0,0.03); border:1px solid #e2e8f0; text-align:left;">
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; flex-wrap:wrap;">
            <div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, #6366f1, #4f46e5); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; box-shadow:0 4px 14px rgba(99,102,241,0.35); flex-shrink:0;">
              ${initials}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <h2 style="font-size:20px; font-weight:900; color:#0f172a; margin:0; line-height:1.2;">${p.name}</h2>
                <span style="background:#e0e7ff; color:#4338ca; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px; text-transform:uppercase;">${eventBadge}</span>
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="color:#64748b; font-weight:600;">Phone Number:</span>
              <strong style="color:#0f172a; font-weight:800; font-size:14px;">${phone}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="color:#64748b; font-weight:600;">Registration ID:</span>
              <span style="background:#eef2ff; color:#4338ca; font-size:12px; font-weight:800; padding:4px 10px; border-radius:6px; font-family:monospace;">${regId}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="color:#64748b; font-weight:600;">Email Address:</span>
              <strong style="color:#0f172a; font-weight:700;">${email}</strong>
            </div>
            <div style="border-top:1px dashed #e2e8f0; margin-top:6px; padding-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="color:#64748b; font-weight:600;">Registered Date:</span>
              <span style="color:#334155; font-weight:700;">${regDateStr}</span>
            </div>
          </div>
        </div>

        <!-- 2. Registration Status Card -->
        <div style="background:#ffffff; border:1.5px solid #bbf7d0; border-radius:18px; padding:18px 24px; box-shadow:0 2px 10px rgba(0,0,0,0.02); text-align:left;">
          <div style="font-size:10px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">REGISTRATION STATUS</div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0;">Event Registration</h3>
            <span style="background:#d1fae5; color:#047857; border:1px solid #a7f3d0; font-size:12px; font-weight:800; padding:5px 14px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">
              ✅ Registered
            </span>
          </div>
        </div>

        <!-- 3. Entrance Attendance Card -->
        <div style="background:#ffffff; border:1.5px solid ${p.attended ? '#bbf7d0' : '#e2e8f0'}; border-radius:18px; padding:18px 24px; box-shadow:0 2px 10px rgba(0,0,0,0.02); text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">📱</span>
              <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0;">Entrance Attendance</h3>
            </div>
            <span style="background:${p.attended ? '#d1fae5' : '#f1f5f9'}; color:${p.attended ? '#047857' : '#64748b'}; border:1px solid ${p.attended ? '#a7f3d0' : '#cbd5e1'}; font-size:12px; font-weight:800; padding:5px 14px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">
              ${p.attended ? '✅ Attendance Completed' : '⏳ Attendance Pending'}
            </span>
          </div>
          ${p.attended ? `
            <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:10px 14px; margin-top:14px; color:#047857; font-size:12px; font-weight:700; display:flex; align-items:center; gap:8px;">
              <span>🕒</span> <span>Recorded At: <strong>${attendedTimeStr || 'Attendance Verified'}</strong></span>
            </div>
          ` : ''}
        </div>

        <!-- 4. Welcome Event Kit Card -->
        <div style="background:#ffffff; border:1.5px solid ${p.kitIssued ? '#f5d0fe' : '#e2e8f0'}; border-radius:18px; padding:18px 24px; box-shadow:0 2px 10px rgba(0,0,0,0.02); text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">🎒</span>
              <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0;">Welcome Event Kit</h3>
            </div>
            <span style="background:${p.kitIssued ? '#fae8ff' : '#f1f5f9'}; color:${p.kitIssued ? '#86198f' : '#64748b'}; border:1px solid ${p.kitIssued ? '#f0abfc' : '#cbd5e1'}; font-size:12px; font-weight:800; padding:5px 14px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">
              ${p.kitIssued ? '✅ Kit Issued' : '⏳ Kit Pending'}
            </span>
          </div>
          ${p.kitIssued ? `
            <div style="background:#fdf4ff; border:1px solid #f5d0fe; border-radius:12px; padding:10px 14px; margin-top:14px; color:#86198f; font-size:12px; font-weight:700; display:flex; align-items:center; gap:8px;">
              <span>🕒</span> <span>Issued At: <strong>${kitIssuedTimeStr || 'Kit Distributed'}</strong></span>
            </div>
          ` : ''}
        </div>

        <!-- 5. Food Coupon Card -->
        <div style="background:#ffffff; border:1.5px solid ${p.foodRedeemed ? '#fed7aa' : '#e2e8f0'}; border-radius:18px; padding:18px 24px; box-shadow:0 2px 10px rgba(0,0,0,0.02); text-align:left; margin-bottom:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">🍽️</span>
              <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0;">Food Coupon</h3>
            </div>
            <span style="background:${p.foodRedeemed ? '#ffedd5' : '#f1f5f9'}; color:${p.foodRedeemed ? '#c2410c' : '#64748b'}; border:1px solid ${p.foodRedeemed ? '#fdba74' : '#cbd5e1'}; font-size:12px; font-weight:800; padding:5px 14px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">
              ${p.foodRedeemed ? '✅ Food Coupon Redeemed' : '⏳ Coupon Pending'}
            </span>
          </div>
          ${p.foodRedeemed ? `
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:14px; padding:14px 16px; margin-top:14px; display:flex; flex-direction:column; gap:10px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span style="color:#9a3412; font-weight:700;">Coupon Number:</span>
                <strong style="color:#c2410c; font-weight:800; font-family:monospace;">${regId}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span style="color:#9a3412; font-weight:700;">Meal Type:</span>
                <strong style="color:#9a3412; font-weight:800;">Standard Veg / Refreshments</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; border-top:1px dashed #fed7aa; margin-top:2px; padding-top:8px;">
                <span style="color:#9a3412; font-weight:700;">Redeemed At:</span>
                <strong style="color:#c2410c; font-weight:800;">${foodRedeemedTimeStr || 'Redeemed'}</strong>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 6. Search Another Participant Button -->
        <button type="button" id="btn-search-again-details" style="width:100%; background:linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color:#ffffff; border:none; padding:16px; border-radius:16px; font-size:15px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 14px rgba(79,70,229,0.35); margin-top:8px; margin-bottom:48px; transition:all 0.2s;">
          🔍 Search Another Participant
        </button>

      </div>
    `;

    document.getElementById('btn-search-again-details')?.addEventListener('click', () => renderSearchFormView());
  }

  renderSearchFormView();
}

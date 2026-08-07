import { state, navigate } from '../app.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { API_BASE } from '../utils/constants.js';
import { apiFetch } from '../services/api.js';
import { getQRCode, regenerateQR } from '../services/qrService.js';

export async function renderUsers() {
  const app = document.getElementById('app');

  // Authorization check
  const token = state.token || localStorage.getItem('admin_token');
  if (!token) {
    navigate('#login');
    return;
  }

  let usersList = [];
  let eventsList = [];
  let loading = true;
  let errorMsg = '';
  let successMsg = '';
  // Map of "adminId::eventId" -> qrDataUrl (populated after assign or view)
  const qrCache = {};

  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar('users', state.user)}
      <div class="main-wrapper">
        ${renderHeader('Admin & User Management', false)}
        <main class="content-body" style="padding:28px 32px; background:#f8fafc; min-height:calc(100vh - 70px);">
          <div id="users-page-container">
            <div style="text-align:center; padding:60px 20px; color:#64748b; font-weight:600;">
              ⏳ Loading Admin Users & Roles...
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Fetch users and events data
  async function loadData() {
    try {
      const [usersRes, eventsRes] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/events')
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        usersList = uData.users || [];
      }
      if (eventsRes.ok) {
        eventsList = await eventsRes.json();
      }
    } catch (err) {
      errorMsg = 'Failed to load user roster data.';
    } finally {
      loading = false;
      renderUI();
    }
  }

  function renderUI() {
    const container = document.getElementById('users-page-container');
    if (!container) return;

    // Filter out super_admin accounts so this interface manages only Admins and Event Organizers
    const managedUsers = usersList.filter(u => u.role !== 'super_admin' && u.role !== 'superadmin');

    const eventsOptionsHTML = eventsList.map(ev => 
      `<option value="${ev._id}">${ev.title} (${ev.category || 'General'})</option>`
    ).join('');

    const userCardsHTML = managedUsers.map(u => {
      const initial = (u.fullName || u.username || u.email || 'A').charAt(0).toUpperCase();
      const roleText = (u.role || 'admin').replace('_', '-').toUpperCase();
      const isActive = u.status === 'active';
      const allAssignedIds = Array.isArray(u.assignedEventIds) && u.assignedEventIds.length > 0
        ? u.assignedEventIds
        : (u.assignedEventId ? [u.assignedEventId] : (Array.isArray(u.assignedEvents) ? u.assignedEvents : []));

      const firstEvtId = allAssignedIds[0] || null;
      const assignedEvt = eventsList.find(e => String(e._id) === String(firstEvtId));
      const assignedEvtText = assignedEvt ? assignedEvt.title : (firstEvtId ? `ID: ${firstEvtId}` : 'None Assigned');

      const qrButtonsHTML = allAssignedIds.map(evId => {
        const evTitle = (eventsList.find(e => String(e._id) === evId) || {}).title || evId;
        return `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; margin-top:8px;">
            <div style="font-size:11px; font-weight:700; color:#64748b; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              📍 ${evTitle}
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn-view-qr" data-admin-id="${u._id}" data-event-id="${evId}" data-event-title="${evTitle}" data-admin-name="${u.fullName || u.username}"
                style="background:#4f46e5; color:#fff; border:none; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                🔲 View QR
              </button>
              <button class="btn-download-qr" data-admin-id="${u._id}" data-event-id="${evId}" data-event-title="${evTitle}" data-admin-name="${u.fullName || u.username}"
                style="background:#059669; color:#fff; border:none; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                ⬇ Download
              </button>
              <button class="btn-regen-qr" data-admin-id="${u._id}" data-event-id="${evId}" data-event-title="${evTitle}"
                style="background:#f59e0b; color:#fff; border:none; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                🔄 Regenerate
              </button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="user-card" style="background:#ffffff; border-radius:20px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03); border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
          
          <!-- Top Row: Avatar + Details + Badges -->
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:48px; height:48px; border-radius:50%; background:#4f46e5; color:#ffffff; font-size:20px; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(79,70,229,0.3);">
                ${initial}
              </div>
              <div>
                <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 2px 0;">${u.fullName || u.username}</h4>
                <p style="font-size:13px; color:#64748b; font-weight:500; margin:0;">${u.email}</p>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
              <span style="font-size:10px; font-weight:800; padding:4px 10px; border-radius:12px; background:#dbeafe; color:#1e40af; letter-spacing:0.5px;">
                ${roleText}
              </span>
              <span style="font-size:10px; font-weight:800; padding:4px 10px; border-radius:12px; background:${isActive ? '#dcfce7' : '#fef2f2'}; color:${isActive ? '#15803d' : '#b91c1c'};">
                ${isActive ? 'ACTIVE' : 'DEACTIVATED'}
              </span>
            </div>
          </div>

          <!-- Actions Row: Role, Toggle Status, Delete -->
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px;">
            <button class="btn-change-role" data-id="${u._id}" data-role="${u.role}" style="background:#f8fafc; border:1px solid #e2e8f0; color:#334155; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
              ✏️ Role
            </button>

            <button class="btn-toggle-status" data-id="${u._id}" data-status="${u.status}" style="background:${isActive ? '#fff7ed' : '#f0fdf4'}; border:1px solid ${isActive ? '#fed7aa' : '#bbf7d0'}; color:${isActive ? '#c2410c' : '#15803d'}; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
              ${isActive ? '⊘ Deactivate' : '✔ Activate'}
            </button>

            <button class="btn-delete-user" data-id="${u._id}" title="Delete User" style="background:#fef2f2; border:1px solid #fecaca; color:#ef4444; width:32px; height:32px; border-radius:50%; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; margin-left:auto;">
              🗑️
            </button>
          </div>

          <!-- Assigned Events Section -->
          <div style="border-top:1px solid #f1f5f9; padding-top:14px; margin-top:auto;">
            <div style="font-size:11px; font-weight:800; color:#94a3b8; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:4px;">
              ASSIGNED EVENTS
            </div>
            <p style="font-size:12.5px; color:#64748b; font-weight:600; margin-bottom:10px; font-style:italic;">
              Assigned to: <strong style="color:#334155; font-style:normal;">${assignedEvtText}</strong>
            </p>

            <div style="display:flex; gap:8px;">
              <select class="assign-event-select form-control" data-id="${u._id}" style="flex:1; padding:8px 12px; border-radius:12px; border:1px solid #cbd5e1; font-size:13px; background:#ffffff;">
                <option value="">Assign Event...</option>
                ${eventsOptionsHTML}
              </select>
              <button class="btn-submit-assign" data-id="${u._id}" style="background:#4f46e5; color:#ffffff; border:none; padding:8px 16px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer;">
                Assign
              </button>
            </div>

            <!-- QR Code Buttons (shown when event(s) are assigned) -->
            ${qrButtonsHTML}
          </div>

        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        
        ${errorMsg ? `<div class="alert alert-danger" style="margin-bottom:8px;">⚠️ ${errorMsg}</div>` : ''}
        ${successMsg ? `<div class="alert alert-success" style="margin-bottom:8px;">✅ ${successMsg}</div>` : ''}

        <div style="display:grid; grid-template-columns: 1fr 360px; gap:28px; align-items:start;">
          
          <!-- Left Column: User Cards Grid -->
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
              <span style="font-size:14px; color:#64748b; font-weight:700; background:#ffffff; padding:6px 14px; border-radius:20px; border:1px solid #e2e8f0;">
                Total Admins & Organizers: ${managedUsers.length}
              </span>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
              ${userCardsHTML.length > 0 ? userCardsHTML : `
                <div style="grid-column:1/-1; background:#ffffff; padding:40px; border-radius:20px; text-align:center; color:#64748b; font-weight:600; border:1px solid #e2e8f0;">
                  No event admin users found. Create a new admin or organizer using the form on the right.
                </div>
              `}
            </div>
          </div>

          <!-- Right Column: Add New User Form Card -->
          <div style="background:#ffffff; border-radius:24px; padding:28px 24px; box-shadow:0 10px 30px rgba(0,0,0,0.04); border:1px solid #e2e8f0; position:sticky; top:90px;">
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:20px; display:flex; align-items:center; gap:8px;">
              Add New User
            </h3>

            <form id="create-user-form">
              <div style="margin-bottom:16px; text-align:left;">
                <label style="display:block; font-size:12.5px; font-weight:800; color:#334155; margin-bottom:6px;">
                  Full Name <span style="color:#ef4444;">*</span>
                </label>
                <input type="text" id="new-user-fullname" placeholder="Enter full name" required style="width:100%; border:1px solid #cbd5e1; border-radius:12px; padding:12px 14px; font-size:14px; font-weight:600;" />
              </div>

              <div style="margin-bottom:16px; text-align:left;">
                <label style="display:block; font-size:12.5px; font-weight:800; color:#334155; margin-bottom:6px;">
                  Email Address <span style="color:#ef4444;">*</span>
                </label>
                <input type="email" id="new-user-email" placeholder="Enter email address" required style="width:100%; border:1px solid #cbd5e1; border-radius:12px; padding:12px 14px; font-size:14px; font-weight:600;" />
              </div>

              <div style="margin-bottom:16px; text-align:left;">
                <label style="display:block; font-size:12.5px; font-weight:800; color:#334155; margin-bottom:6px;">
                  Assign Role <span style="color:#ef4444;">*</span>
                </label>
                <select id="new-user-role" style="width:100%; border:1px solid #cbd5e1; border-radius:12px; padding:12px 14px; font-size:14px; font-weight:600; background:#ffffff;">
                  <option value="admin" selected>Admin</option>
                  <option value="staff">Staff / Event Organizer</option>
                </select>
              </div>

              <div style="margin-bottom:16px; text-align:left;">
                <label style="display:block; font-size:12.5px; font-weight:800; color:#334155; margin-bottom:6px;">
                  Password <span style="color:#ef4444;">*</span>
                </label>
                <input type="password" id="new-user-password" placeholder="••••••••" required style="width:100%; border:1px solid #cbd5e1; border-radius:12px; padding:12px 14px; font-size:14px;" />
              </div>

              <div style="margin-bottom:24px; text-align:left;">
                <label style="display:block; font-size:12.5px; font-weight:800; color:#334155; margin-bottom:6px;">
                  Confirm Password <span style="color:#ef4444;">*</span>
                </label>
                <input type="password" id="new-user-confirm-password" placeholder="••••••••" required style="width:100%; border:1px solid #cbd5e1; border-radius:12px; padding:12px 14px; font-size:14px;" />
              </div>

              <button type="submit" id="btn-create-user" style="width:100%; background:#4f46e5; color:#ffffff; border:none; padding:14px; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(79,70,229,0.35); display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                👤+ Create User
              </button>
            </form>
          </div>

        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Logout listener
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('#login');
    });

    // Create New User Form submit
    document.getElementById('create-user-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('new-user-fullname').value.trim();
      const email = document.getElementById('new-user-email').value.trim();
      const role = document.getElementById('new-user-role').value;
      const password = document.getElementById('new-user-password').value;
      const confirmPassword = document.getElementById('new-user-confirm-password').value;

      if (password !== confirmPassword) {
        alert('⚠️ Passwords do not match. Please re-enter.');
        return;
      }

      const submitBtn = document.getElementById('btn-create-user');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating User...';

      try {
        const res = await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify({ fullName, email, role, password })
        });
        const data = await res.json();

        if (res.ok) {
          successMsg = `User ${email} created successfully.`;
          errorMsg = '';
          await loadData();
        } else {
          alert(`⚠️ ${data.error || 'Failed to create user.'}`);
        }
      } catch (err) {
        alert('⚠️ Network error while creating user.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = '👤+ Create User';
      }
    });

    // Toggle user status (Activate / Deactivate)
    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const currentStatus = this.getAttribute('data-status');
        const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';

        try {
          const res = await apiFetch(`/api/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            successMsg = `User status updated to ${newStatus}.`;
            await loadData();
          } else {
            const data = await res.json();
            alert(`⚠️ ${data.error || 'Failed to update status.'}`);
          }
        } catch (err) {
          alert('⚠️ Network error.');
        }
      });
    });

    // Change role button listener
    document.querySelectorAll('.btn-change-role').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const currentRole = this.getAttribute('data-role');

        const newRole = prompt(`Enter new role for user (admin, staff):`, currentRole);
        if (!newRole || newRole === currentRole) return;

        if (!['admin', 'staff'].includes(newRole.trim().toLowerCase())) {
          alert('⚠️ Invalid role. Choose from: admin, staff');
          return;
        }

        try {
          const res = await apiFetch(`/api/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole.trim().toLowerCase() })
          });
          if (res.ok) {
            successMsg = `User role updated to ${newRole}.`;
            await loadData();
          } else {
            const data = await res.json();
            alert(`⚠️ ${data.error || 'Failed to update role.'}`);
          }
        } catch (err) {
          alert('⚠️ Network error.');
        }
      });
    });

    // Delete user listener
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this admin user?')) return;

        try {
          const res = await apiFetch(`/api/users/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            successMsg = 'User deleted successfully.';
            await loadData();
          } else {
            const data = await res.json();
            alert(`⚠️ ${data.error || 'Failed to delete user.'}`);
          }
        } catch (err) {
          alert('⚠️ Network error.');
        }
      });
    });

    // Assign event listener — enhanced to cache QR returned by backend
    document.querySelectorAll('.btn-submit-assign').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const select = document.querySelector(`.assign-event-select[data-id="${id}"]`);
        const eventId = select ? select.value : '';

        if (!eventId) {
          alert('⚠️ Please select an event to assign.');
          return;
        }

        this.disabled = true;
        this.innerText = 'Assigning…';
        try {
          const res = await apiFetch(`/api/users/${id}/assign-event`, {
            method: 'PATCH',
            body: JSON.stringify({ eventId })
          });
          const data = await res.json();
          if (res.ok) {
            successMsg = '✅ Event assigned & QR code generated automatically.';
            // Cache QR from response so it can be shown immediately after reload
            if (data.qrDataUrl) {
              qrCache[`${id}::${eventId}`] = data.qrDataUrl;
            }
            await loadData();
          } else {
            alert(`⚠️ ${data.error || 'Failed to assign event.'}`);
          }
        } catch (err) {
          alert('⚠️ Network error.');
        } finally {
          this.disabled = false;
          this.innerText = 'Assign';
        }
      });
    });

    // ── QR: View QR ──────────────────────────────────────────────────────────
    document.querySelectorAll('.btn-view-qr').forEach(btn => {
      btn.addEventListener('click', async function() {
        const adminId    = this.getAttribute('data-admin-id');
        const eventId    = this.getAttribute('data-event-id');
        const eventTitle = this.getAttribute('data-event-title');
        const adminName  = this.getAttribute('data-admin-name');
        const cacheKey   = `${adminId}::${eventId}`;

        this.disabled = true;
        this.innerText = '⏳ Loading…';
        try {
          let qrDataUrl = qrCache[cacheKey];
          if (!qrDataUrl) {
            const result = await getQRCode(adminId, eventId);
            qrDataUrl = result.qrCode?.qrDataUrl;
            if (qrDataUrl) qrCache[cacheKey] = qrDataUrl;
          }
          if (qrDataUrl) {
            showQRModal(adminName, eventTitle, adminId, eventId, qrDataUrl);
          } else {
            alert('⚠️ QR code image not available. Try Regenerate.');
          }
        } catch (err) {
          alert(`⚠️ ${err.message || 'Failed to load QR code.'}`);
        } finally {
          this.disabled = false;
          this.innerText = '🔲 View QR';
        }
      });
    });

    // ── QR: Download QR ──────────────────────────────────────────────────────
    document.querySelectorAll('.btn-download-qr').forEach(btn => {
      btn.addEventListener('click', async function() {
        const adminId    = this.getAttribute('data-admin-id');
        const eventId    = this.getAttribute('data-event-id');
        const eventTitle = this.getAttribute('data-event-title');
        const adminName  = this.getAttribute('data-admin-name');
        const cacheKey   = `${adminId}::${eventId}`;

        this.disabled = true;
        this.innerText = '⏳ Preparing…';
        try {
          let qrDataUrl = qrCache[cacheKey];
          if (!qrDataUrl) {
            const result = await getQRCode(adminId, eventId);
            qrDataUrl = result.qrCode?.qrDataUrl;
            if (qrDataUrl) qrCache[cacheKey] = qrDataUrl;
          }
          if (qrDataUrl) {
            downloadQRImage(qrDataUrl, adminName, eventTitle);
          } else {
            alert('⚠️ QR code not available. Try Regenerate first.');
          }
        } catch (err) {
          alert(`⚠️ ${err.message || 'Failed to download QR code.'}`);
        } finally {
          this.disabled = false;
          this.innerText = '⬇ Download';
        }
      });
    });

    // ── QR: Regenerate QR ────────────────────────────────────────────────────
    document.querySelectorAll('.btn-regen-qr').forEach(btn => {
      btn.addEventListener('click', async function() {
        const adminId    = this.getAttribute('data-admin-id');
        const eventId    = this.getAttribute('data-event-id');
        const eventTitle = this.getAttribute('data-event-title');
        const cacheKey   = `${adminId}::${eventId}`;

        if (!confirm(`Regenerate QR for event "${eventTitle}"?\nThe previous QR code will still work — regeneration just creates a fresh one.`)) return;

        this.disabled = true;
        this.innerText = '⏳ Regenerating…';
        try {
          const result = await regenerateQR(adminId, eventId);
          if (result.qrDataUrl) {
            qrCache[cacheKey] = result.qrDataUrl;
            successMsg = '✅ QR code regenerated successfully.';
            renderUI();
            alert('✅ QR code regenerated! Click "View QR" to see the new code.');
          }
        } catch (err) {
          alert(`⚠️ ${err.message || 'Failed to regenerate QR code.'}`);
        } finally {
          this.disabled = false;
          this.innerText = '🔄 Regenerate';
        }
      });
    });
  }

  // ── QR Modal ─────────────────────────────────────────────────────────────────
  function showQRModal(adminName, eventTitle, adminId, eventId, qrDataUrl) {
    const existingModal = document.getElementById('qr-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'qr-modal-overlay';
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999;
      display:flex; align-items:center; justify-content:center;
      animation:fadeIn 0.2s ease;
    `;
    modal.innerHTML = `
      <div style="background:#ffffff; border-radius:24px; padding:36px 32px; max-width:440px; width:90%; box-shadow:0 24px 60px rgba(0,0,0,0.3); text-align:center; position:relative;">
        <button id="qr-modal-close" style="position:absolute; top:16px; right:16px; background:#f1f5f9; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; color:#475569; display:flex; align-items:center; justify-content:center;">✕</button>

        <div style="width:48px; height:48px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:14px; display:inline-flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:16px;">🔲</div>
        <h2 style="font-size:18px; font-weight:900; color:#0f172a; margin-bottom:4px;">Admin QR Code</h2>
        <p style="font-size:13px; color:#64748b; font-weight:600; margin-bottom:6px;">Admin: <strong style="color:#334155;">${adminName}</strong></p>
        <p style="font-size:12px; color:#64748b; margin-bottom:20px;">Event: <strong style="color:#4f46e5;">${eventTitle}</strong></p>

        <div style="background:#f8fafc; border:2px solid #e2e8f0; border-radius:16px; padding:16px; display:inline-block; margin-bottom:20px;">
          <img id="qr-modal-img" src="${qrDataUrl}" alt="Admin QR Code"
            style="width:260px; height:260px; display:block; border-radius:8px;" />
        </div>

        <p style="font-size:11px; color:#94a3b8; margin-bottom:20px;">
          Scan with phone camera to open Admin Login Page
        </p>

        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <button id="qr-modal-download" style="background:#059669; color:#fff; border:none; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            ⬇ Download PNG
          </button>
          <button id="qr-modal-print" style="background:#4f46e5; color:#fff; border:none; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            🖨 Print QR
          </button>
          <button id="qr-modal-regen" style="background:#f59e0b; color:#fff; border:none; padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            🔄 Regenerate
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    document.getElementById('qr-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Download
    document.getElementById('qr-modal-download').addEventListener('click', () => {
      downloadQRImage(qrDataUrl, adminName, eventTitle);
    });

    // Print
    document.getElementById('qr-modal-print').addEventListener('click', () => {
      const printWin = window.open('', '_blank');
      printWin.document.write(`
        <html><head><title>QR Code – ${adminName} – ${eventTitle}</title></head>
        <body style="text-align:center; padding:40px; font-family:sans-serif;">
          <h2 style="margin-bottom:4px;">Admin QR Code</h2>
          <p style="color:#555; margin-bottom:4px;"><strong>Admin:</strong> ${adminName}</p>
          <p style="color:#555; margin-bottom:20px;"><strong>Event:</strong> ${eventTitle}</p>
          <img src="${qrDataUrl}" style="width:300px; height:300px;" />
          <p style="color:#888; font-size:12px; margin-top:16px;">Scan to open Admin Login Page</p>
        </body></html>
      `);
      printWin.document.close();
      printWin.print();
    });

    // Regenerate from modal
    document.getElementById('qr-modal-regen').addEventListener('click', async () => {
      if (!confirm(`Regenerate QR for event "${eventTitle}"?`)) return;
      document.getElementById('qr-modal-regen').disabled = true;
      document.getElementById('qr-modal-regen').innerText = '⏳ Regenerating…';
      try {
        const result = await regenerateQR(adminId, eventId);
        if (result.qrDataUrl) {
          qrCache[`${adminId}::${eventId}`] = result.qrDataUrl;
          document.getElementById('qr-modal-img').src = result.qrDataUrl;
          document.getElementById('qr-modal-download').onclick = () => downloadQRImage(result.qrDataUrl, adminName, eventTitle);
        }
      } catch (err) {
        alert(`⚠️ ${err.message || 'Regeneration failed.'}`);
      } finally {
        document.getElementById('qr-modal-regen').disabled = false;
        document.getElementById('qr-modal-regen').innerText = '🔄 Regenerate';
      }
    });
  }

  // ── Download helper ───────────────────────────────────────────────────────────
  function downloadQRImage(qrDataUrl, adminName, eventTitle) {
    const safeName = `${adminName}-${eventTitle}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr_${safeName}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Initial load
  loadData();
}

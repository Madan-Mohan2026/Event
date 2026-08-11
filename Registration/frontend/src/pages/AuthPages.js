import { state, navigate } from '../app.js';
import { loginUser } from '../services/authService.js';
import { qrLogin } from '../services/qrService.js';

export function renderSuperAdminLoginPage(errorMsg = '') {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-left-logo-box">🏛️</div>
        <h1>Smart Event <br><span class="gradient-text">Registration System</span></h1>
        <p class="auth-left-desc">Super Admin Portal for managing events, forms, registrations, and desk controllers.</p>
      </div>
      <div class="auth-right">
        <div class="auth-right-content">
          <div class="auth-card">
            <h2 class="auth-right-title">Super Admin Login</h2>
            <p class="auth-right-subtitle">Enter your system administrator credentials.</p>
            ${errorMsg ? `<div class="alert alert-danger">${errorMsg}</div>` : ''}
            <form id="superadmin-login-form">
              <div class="form-group">
                <label class="form-label">Username / Email</label>
                <input type="text" id="sa-username" class="form-control" placeholder="superadmin" required />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="sa-password" class="form-control" placeholder="••••••••" required />
              </div>
              <button type="submit" class="btn btn-primary btn-full">Sign In</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('superadmin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('sa-username').value.trim();
    const password = document.getElementById('sa-password').value;

    try {
      const result = await loginUser({ username, password });
      if (result.ok && result.data && result.data.token) {
        state.token = result.data.token;
        state.user = result.data.user;
        localStorage.setItem('admin_token', result.data.token);
        localStorage.setItem('admin_user', JSON.stringify(result.data.user));
        navigate('#dashboard');
      } else {
        renderSuperAdminLoginPage(result.data?.error || result.data?.message || 'Invalid login credentials.');
      }
    } catch (err) {
      renderSuperAdminLoginPage(err.message || 'Invalid login credentials.');
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login Page — QR-aware
// If a qrToken is present in the URL (?qrToken=...), we:
//   1. Show a QR-session banner
//   2. Call POST /api/auth/qr-login instead of regular login
//   3. On success: store token + pre-selected event, navigate to #admin-verify
// Without a qrToken, it behaves exactly like the original.
// ─────────────────────────────────────────────────────────────────────────────
export function renderAdminLoginPage(errorMsg = '', qrToken = null) {
  // Attempt to read qrToken from URL hash params if not passed directly
  if (!qrToken) {
    try {
      const hashPart = window.location.hash; // e.g. #login?qrToken=...
      const qIndex = hashPart.indexOf('?');
      if (qIndex !== -1) {
        const searchParams = new URLSearchParams(hashPart.slice(qIndex + 1));
        qrToken = searchParams.get('qrToken') || null;
      }
    } catch {}
  }

  const isQRMode = !!qrToken;
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-left" style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);">
        <div class="auth-left-logo-box" style="background:linear-gradient(135deg,#6366f1,#4f46e5);">⚡</div>
        <h1>RTIh Event Management<br><span class="gradient-text">Manage events with precision.</span></h1>
        <p class="auth-left-desc">The enterprise platform to seamlessly manage your events, attendees, and applications all in one place with unparalleled performance.</p>
        <div style="display:flex; gap:8px; margin-top:24px;">
          <div style="width:32px;height:32px;background:#4f46e5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">AL</div>
          <div style="width:32px;height:32px;background:#0ea5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">MK</div>
          <div style="width:32px;height:32px;background:#8b5cf6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">JO</div>
          <span style="color:#94a3b8;font-size:12px;font-weight:600;align-self:center;">Trusted by 10,000+ event organizers</span>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-right-content">
          <div class="auth-card">
            <h2 class="auth-right-title">Event Admin Portal</h2>
            <p class="auth-right-subtitle">Enter your credentials to access your account.</p>

            ${isQRMode ? `
              <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5); border:1.5px solid #6ee7b7; border-radius:12px; padding:10px 14px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">🔲</span>
                <div>
                  <div style="font-size:12px; font-weight:800; color:#065f46;">QR Authenticated Session</div>
                  <div style="font-size:11px; color:#047857; font-weight:600;">Your event is pre-selected via QR scan. Sign in to continue.</div>
                </div>
              </div>
            ` : `
              <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:8px 14px; margin-bottom:16px; display:inline-flex; align-items:center; gap:8px;">
                <span style="font-size:14px;">⚡</span>
                <span style="font-size:12px; font-weight:700; color:#4338ca;">EVENT ADMIN SIGN IN</span>
              </div>
            `}

            ${errorMsg ? `<div class="alert alert-danger" style="margin-bottom:12px;">${errorMsg}</div>` : ''}

            <form id="admin-login-form">
              <div class="form-group">
                <label class="form-label">Admin Email or Username *</label>
                <input type="text" id="admin-email" class="form-control" placeholder="admin@example.com" required autocomplete="username" />
              </div>
              <div class="form-group">
                <label class="form-label">Password *</label>
                <input type="password" id="admin-password" class="form-control" placeholder="••••••••" required autocomplete="current-password" />
              </div>
              ${!isQRMode ? `
                <div class="form-group" style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                  <input type="checkbox" id="remember-session" style="width:16px; height:16px; accent-color:#4f46e5;" />
                  <label for="remember-session" style="font-size:13px; color:#475569; font-weight:600; cursor:pointer;">Remember session</label>
                </div>
              ` : ''}
              <button type="submit" id="admin-login-btn" class="btn btn-primary btn-full" style="margin-top:8px;">
                Sign in as Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrUsername = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    const btn = document.getElementById('admin-login-btn');
    btn.disabled = true;
    btn.innerText = 'Signing in…';

    try {
      let result;

      if (isQRMode) {
        // ── QR-authenticated login ──────────────────────────────────────────
        result = await qrLogin(qrToken, emailOrUsername, password);

        if (result.ok && result.data && result.data.token) {
          state.token = result.data.token;
          state.user = result.data.user;
          // Pre-select the scanned event and persist it
          if (result.data.scannedEventId) {
            state.currentEvent = { _id: result.data.scannedEventId };
            localStorage.setItem('current_event_id', result.data.scannedEventId);
          }
          localStorage.setItem('admin_token', result.data.token);
          localStorage.setItem('admin_user', JSON.stringify(result.data.user));
          // Clean the qrToken from the URL before navigating
          window.location.hash = '#admin-verify';
        } else {
          renderAdminLoginPage(result.data?.error || 'QR login failed. Please check your credentials.', qrToken);
        }

      } else {
        // ── Standard admin login (unchanged behavior) ───────────────────────
        result = await loginUser({ username: emailOrUsername, email: emailOrUsername, password });

        if (result.ok && result.data && result.data.token) {
          state.token = result.data.token;
          state.user = result.data.user;
          localStorage.setItem('admin_token', result.data.token);
          localStorage.setItem('admin_user', JSON.stringify(result.data.user));
          navigate('#admin-verify');
        } else {
          renderAdminLoginPage(result.data?.error || result.data?.message || 'Invalid login credentials.');
        }
      }
    } catch (err) {
      renderAdminLoginPage(err.message || 'Login failed. Please try again.', isQRMode ? qrToken : null);
    } finally {
      btn.disabled = false;
      btn.innerText = 'Sign in as Admin';
    }
  });
}

export function renderSetupPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-right" style="width:100%;">
        <div class="auth-card" style="margin:auto;">
          <h2>System Onboarding</h2>
          <p>Create Super Admin Account</p>
        </div>
      </div>
    </div>
  `;
}

export function renderHomePage() {
  renderSuperAdminLoginPage();
}

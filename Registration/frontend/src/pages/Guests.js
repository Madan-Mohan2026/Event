import { state, navigate } from '../app.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';

export async function renderGuests() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar('guests', state.user)}
      <div class="main-wrapper">
        ${renderHeader('VIP Guests Manager', false)}
        <main class="content-body">
          <div class="card" style="max-width:800px; margin:0 auto; padding:28px;">
            <h2 style="font-size:20px; font-weight:800; margin-bottom:8px;">👤 VIP Guests & Speakers</h2>
            <p style="color:#64748b; font-size:14px; margin-bottom:24px;">Manage special dignitaries, keynote speakers, and VIP passes.</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:32px; text-align:center; color:#64748b;">
              VIP Guest Roster Active.
            </div>
          </div>
        </main>
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
}

import { state, navigate } from '../app.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';

export async function renderFeedback() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar('feedback', state.user)}
      <div class="main-wrapper">
        ${renderHeader('Participant Feedback Manager', false)}
        <main class="content-body">
          <div class="card" style="max-width:800px; margin:0 auto; padding:28px;">
            <h2 style="font-size:20px; font-weight:800; margin-bottom:8px;">💬 Event Feedback</h2>
            <p style="color:#64748b; font-size:14px; margin-bottom:24px;">Review ratings, comments, and attendee feedback submissions.</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:32px; text-align:center; color:#64748b;">
              Feedback Inbox Active.
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

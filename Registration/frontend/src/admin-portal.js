
// Event Operations Panel — Admin Module Controller (Re-exports)
export { renderAdminPortalLayout, renderAdminDashboard } from './pages/AdminDashboard.js';
export { renderAdminParticipantVerification } from './pages/AdminVerification.js';
export { renderAttendancePage as renderAdminAttendance } from './pages/Attendance.js';
export { renderKits as renderAdminKit } from './pages/Kits.js';
export { renderFoodCoupons as renderAdminFood } from './pages/FoodCoupons.js';
export { exportToExcelCSV } from './utils/helpers.js';

export async function renderAdminProfile() {
  const { renderAdminPortalLayout } = await import('./pages/AdminDashboard.js');
  renderAdminPortalLayout('profile', 'Admin Profile', `
    <div style="padding:24px;background:#fff;border-radius:12px;">
      <h3>Admin Profile & Settings</h3>
      <p>Logged in as Event Admin.</p>
    </div>
  `);
}

import { renderAttendancePage } from './Attendance.js';

export async function renderFoodCoupons(eventId) {
  return renderAttendancePage(eventId, 'food');
}

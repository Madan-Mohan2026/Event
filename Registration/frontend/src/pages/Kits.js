import { renderAttendancePage } from './Attendance.js';

export async function renderKits(eventId) {
  return renderAttendancePage(eventId, 'kit');
}

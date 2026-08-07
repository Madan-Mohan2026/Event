// Tables Component Helper
import { formatDateStr, formatTimeStr } from '../utils/formatter.js';

export function renderRegistrationsTable(registrations = [], options = {}) {
  if (!registrations || registrations.length === 0) {
    return `
      <div class="empty-state" style="text-align:center;padding:40px 20px;color:#64748b;">
        <div style="font-size:36px;margin-bottom:10px;">📋</div>
        <div style="font-weight:700;font-size:16px;">No Registrations Found</div>
        <div style="font-size:13px;">There are no participant records matching your criteria.</div>
      </div>
    `;
  }

  const rows = registrations.map((reg, index) => {
    const regData = reg.formData instanceof Map ? Object.fromEntries(reg.formData) : (reg.formData || {});
    const name = reg.participantName || regData.name || regData.fullName || 'Participant';
    const email = reg.participantEmail || regData.email || 'N/A';
    const phone = reg.participantPhone || regData.phone || regData.mobile || 'N/A';
    const category = reg.category || 'General';
    const regId = reg.registrationId || `#REG-${String(reg._id).substring(18).toUpperCase()}`;

    const attendedBadge = reg.attended
      ? `<span class="badge badge-success">✓ Attended</span>`
      : `<span class="badge badge-secondary">Pending</span>`;

    const kitBadge = reg.kitIssued
      ? `<span class="badge badge-success">✓ Issued</span>`
      : `<span class="badge badge-outline">Not Issued</span>`;

    const foodBadge = reg.foodRedeemed || reg.couponIssued
      ? `<span class="badge badge-success">✓ Redeemed</span>`
      : `<span class="badge badge-outline">Not Redeemed</span>`;

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong style="color:#4f46e5;">${regId}</strong></td>
        <td>
          <div style="font-weight:700;color:#0f172a;">${name}</div>
          <div style="font-size:12px;color:#64748b;">${email}</div>
        </td>
        <td>${phone}</td>
        <td><span class="badge badge-primary">${category}</span></td>
        <td>${attendedBadge}</td>
        <td>${kitBadge}</td>
        <td>${foodBadge}</td>
        <td>
          <div class="action-buttons" style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-outline view-reg-btn" data-id="${reg._id}">👁️ View</button>
            <button class="btn btn-sm btn-danger delete-reg-btn" data-id="${reg._id}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>REG ID</th>
            <th>PARTICIPANT</th>
            <th>PHONE</th>
            <th>CATEGORY</th>
            <th>ATTENDANCE</th>
            <th>KIT</th>
            <th>FOOD</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

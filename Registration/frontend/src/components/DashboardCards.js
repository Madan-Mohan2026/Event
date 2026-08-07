// Dashboard Metric Cards Component

export function renderMetricCard(title, value, subtitle, icon, badgeText = '', colorClass = 'primary') {
  return `
    <div class="metric-card card-${colorClass}">
      <div class="metric-card-header">
        <span class="metric-title">${title}</span>
        <span class="metric-icon">${icon}</span>
      </div>
      <div class="metric-value">${value}</div>
      <div class="metric-footer">
        <span class="metric-subtitle">${subtitle}</span>
        ${badgeText ? `<span class="metric-badge">${badgeText}</span>` : ''}
      </div>
    </div>
  `;
}

export function renderStatsCardsGroup(stats = {}) {
  const totalEvents = stats.totalEvents || stats.eventsCount || 0;
  const totalRegs = stats.totalRegistrations || stats.registrationsCount || 0;
  const totalScans = stats.totalScans || stats.attendedCount || 0;
  const totalKits = stats.kitsIssuedCount || 0;
  const totalFood = stats.foodRedeemedCount || 0;

  return `
    <div class="metrics-grid">
      ${renderMetricCard('Total Events', totalEvents, 'Active & Published', '🏛️', '+2 this month', 'primary')}
      ${renderMetricCard('Registrations', totalRegs, 'Confirmed Participants', '👥', 'Live Sync', 'success')}
      ${renderMetricCard('Entrance Scans', totalScans, 'Checked-in Attendees', '📱', 'Entrance Gate', 'info')}
      ${renderMetricCard('Kits Distributed', totalKits, 'Kit Desk Issued', '🎁', 'Kit Counter', 'warning')}
      ${renderMetricCard('Food Coupons', totalFood, 'Food Desk Redeemed', '🍱', 'Food Counter', 'accent')}
    </div>
  `;
}

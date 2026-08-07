export function renderEventCardStats(event) {
  const regs = event.regsCount !== undefined ? event.regsCount : 0;
  const food = event.foodCount !== undefined ? event.foodCount : 0;
  const kits = event.kitsCount !== undefined ? event.kitsCount : 0;
  const scans = event.scansCount !== undefined ? event.scansCount : 0;

  return `
    <div class="event-card-stats-grid">
      <div class="event-stat-box">
        <span class="stat-num">${regs}</span>
        <span class="stat-lbl">REGS</span>
      </div>
      <div class="event-stat-box">
        <span class="stat-num">${food}</span>
        <span class="stat-lbl">FOOD</span>
      </div>
      <div class="event-stat-box">
        <span class="stat-num">${kits}</span>
        <span class="stat-lbl">KITS</span>
      </div>
      <div class="event-stat-box">
        <span class="stat-num">${scans}</span>
        <span class="stat-lbl">SCANS</span>
      </div>
    </div>
  `;
}

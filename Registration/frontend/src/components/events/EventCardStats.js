export function renderEventCardStats(event) {
  const regs = event.regsCount !== undefined ? event.regsCount : 0;
  const food = event.foodCount !== undefined ? event.foodCount : 0;
  const teaSnacks = event.teaSnacksCount !== undefined ? event.teaSnacksCount : 0;
  const kits = event.kitsCount !== undefined ? event.kitsCount : 0;
  const scans = event.scansCount !== undefined ? event.scansCount : 0;

  const refType = event.refreshmentType || 'food';
  let refCount = food;
  let refLabel = 'FOOD';

  if (refType === 'tea_snacks') {
    refCount = teaSnacks;
    refLabel = 'TEA';
  } else if (refType === 'none') {
    refCount = '—';
    refLabel = 'NO FOOD';
  }

  return `
    <div class="event-card-stats-grid">
      <div class="event-stat-box">
        <span class="stat-num">${regs}</span>
        <span class="stat-lbl">REGS</span>
      </div>
      <div class="event-stat-box">
        <span class="stat-num">${refCount}</span>
        <span class="stat-lbl">${refLabel}</span>
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

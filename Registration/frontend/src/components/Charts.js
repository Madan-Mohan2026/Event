// Charts Component Helper

export function renderChartCanvas(canvasId, title = 'Event Analytics') {
  return `
    <div class="chart-card card">
      <div class="card-header">
        <h3 class="card-title">${title}</h3>
      </div>
      <div class="card-body" style="position:relative;height:260px;">
        <canvas id="${canvasId}"></canvas>
      </div>
    </div>
  `;
}

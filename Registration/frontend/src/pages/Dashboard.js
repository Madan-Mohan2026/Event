import { state, navigate } from '../app.js';
import { getDashboardStats } from '../services/dashboardService.js';
import { getEvents } from '../services/eventService.js';
import { getRegistrations } from '../services/registrationService.js';
import { apiFetch } from '../services/api.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';

export async function renderDashboard() {
  const app = document.getElementById('app');
  if (app && (!document.querySelector('.admin-layout') || !document.getElementById('card-total-events'))) {
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('dashboard', state.user)}
        <div class="main-wrapper">
          ${renderHeader('System Admin Dashboard', true)}
          <main class="content-body">
            <div style="text-align:center; padding:60px; color:#64748b; font-size:15px;">Loading System Dashboard...</div>
          </main>
        </div>
      </div>
    `;
  }

  try {
    const stats = await getDashboardStats();

    const totalReg = stats.totalRegistrations || 0;
    const kits = stats.kitsIssued || 0;
    const coupons = stats.couponsIssued || 0;
    const attendance = stats.attendanceCount || 0;
    const absent = Math.max(0, totalReg - attendance);
    const foodPercent = totalReg > 0 ? Math.round((coupons / totalReg) * 100) : 0;

    function buildLineChart(points, color = '#4f46e5', labels = [], height = 140, showDots = true) {
      if (!points || points.length === 0) return `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="12">No data</text>`;
      const W = 280, H = height;
      const maxVal = Math.max(...points, 1);
      const minVal = 0;
      const range = maxVal - minVal || 1;
      const stepX = W / Math.max(points.length - 1, 1);
      const coords = points.map((v, i) => ({ x: i * stepX, y: H - ((v - minVal) / range) * (H - 10) }));
      const polyline = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
      const areaPath = `M${coords[0].x.toFixed(1)},${H} ` + coords.map(c => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') + ` L${coords[coords.length-1].x.toFixed(1)},${H} Z`;
      const dots = showDots ? coords.map(c => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`).join('') : '';
      const labelEls = labels.map((lbl, i) => `<text x="${(i * stepX).toFixed(1)}" y="${H + 14}" text-anchor="middle" fill="#94a3b8" font-size="10">${lbl}</text>`).join('');
      const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => {
        const val = Math.round(minVal + t * range);
        const y = H - t * (H - 10);
        return `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/><text x="-4" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="#94a3b8" font-size="9">${val}</text>`;
      }).join('');
      return `${yTicks}<path d="${areaPath}" fill="${color}" opacity="0.08"/><polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labelEls}`;
    }

    function buildBarChart(labels, values, color = '#4f46e5', height = 140) {
      if (!values || values.length === 0) return `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="12">No data</text>`;
      const W = 280, H = height;
      const maxVal = Math.max(...values, 1);
      const barW = Math.min(36, (W / values.length) - 8);
      const gap = (W - barW * values.length) / (values.length + 1);
      const yTicks = [0, 0.5, 1].map(t => {
        const val = Math.round(t * maxVal);
        const y = H - t * (H - 10);
        return `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/><text x="-4" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="#94a3b8" font-size="9">${val}</text>`;
      }).join('');
      const bars = values.map((v, i) => {
        const x = gap + i * (barW + gap);
        const barH = (v / maxVal) * (H - 10);
        const y = H - barH;
        const label = labels[i] ? labels[i].substring(0, 8) : '';
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${barH.toFixed(1)}" rx="4" fill="${color}" opacity="0.85"/><text x="${(x + barW/2).toFixed(1)}" y="${H + 14}" text-anchor="middle" fill="#94a3b8" font-size="9">${label}</text><text x="${(x + barW/2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" fill="${color}" font-size="9" font-weight="600">${v}</text>`;
      }).join('');
      return `${yTicks}${bars}`;
    }

    function buildDonutChart(slices, colors) {
      const total = slices.reduce((s, c) => s + c.value, 0) || 1;
      const cx = 70, cy = 70, r = 55, innerR = 34;
      let startAngle = -Math.PI / 2;
      const paths = slices.map((s, i) => {
        const angle = (s.value / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(startAngle), iy1 = cy + innerR * Math.sin(startAngle);
        const ix2 = cx + innerR * Math.cos(endAngle),   iy2 = cy + innerR * Math.sin(endAngle);
        const large = angle > Math.PI ? 1 : 0;
        const d = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${innerR},${innerR} 0 ${large} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
        startAngle = endAngle;
        return `<path d="${d}" fill="${colors[i % colors.length]}" opacity="0.9"/>`;
      }).join('');
      const legend = slices.map((s, i) => `<circle cx="155" cy="${30 + i * 22}" r="6" fill="${colors[i % colors.length]}"/><text x="165" y="${34 + i * 22}" fill="#334155" font-size="11">${s.label} (${s.value})</text>`).join('');
      return `${paths}<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="700">${total}</text>${legend}`;
    }

    const regByEvent = stats.registrationsByEvent || [];
    const regTrendLabels = regByEvent.map(e => e.title ? e.title.substring(0, 6) : '');
    const regTrendValues = regByEvent.map(e => e.count || 0);
    const regTrendSVG = `<svg viewBox="0 0 310 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible"><g transform="translate(28,8)">${buildLineChart(regTrendValues, '#4f46e5', regTrendLabels, 140, true)}</g></svg>`;

    const attendSlices = [{ label: 'Present', value: attendance }, { label: 'Absent', value: absent }];
    const attendDonutSVG = attendance + absent > 0
      ? `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible">${buildDonutChart(attendSlices, ['#22c55e','#ef4444'])}</svg>`
      : `<div style="text-align:center;padding:40px;color:#94a3b8;font-size:12px;">No attendance data yet</div>`;

    const foodSVG = `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible">
      ${buildDonutChart([{label:'Distributed',value:coupons},{label:'Remaining',value:Math.max(0,totalReg-coupons)}],['#d97706','#e2e8f0'])}
    </svg>`;

    const regBarLabels = regByEvent.map(e => e.title || '');
    const regBarValues = regByEvent.map(e => e.count || 0);
    const regBarSVG = `<svg viewBox="0 0 310 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible"><g transform="translate(28,8)">${buildBarChart(regBarLabels, regBarValues, '#0891b2', 140)}</g></svg>`;

    const catColors = ['#4f46e5','#d97706','#22c55e','#ec4899','#f97316','#0891b2'];
    const catSlices = (stats.participantCategories || []).map(c => ({ label: c.category || 'Unknown', value: c.count }));
    const catSVG = catSlices.length > 0
      ? `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible">${buildDonutChart(catSlices, catColors)}</svg>`
      : `<div style="text-align:center;padding:40px;color:#94a3b8;font-size:12px;">No category data yet</div>`;

    const dashboardHTML = `
      <div class="card-grid-custom">
        <div class="dashboard-section-label">Core Event Metrics</div>
        <div class="metric-card-interactive" id="card-total-events">
          <div class="metric-card-icon-wrapper icon-blue">📅</div>
          <div class="metric-card-title">Total Events</div>
          <div class="metric-card-value" id="metric-val-total-events">${stats.totalEvents}</div>
        </div>
        <div class="metric-card-interactive" id="card-total-registrations">
          <div class="metric-card-icon-wrapper icon-cyan">📂</div>
          <div class="metric-card-title">Total Registrations</div>
          <div class="metric-card-value" id="metric-val-total-registrations">${stats.totalRegistrations}</div>
        </div>
        <div class="metric-card-interactive" id="card-attendance">
          <div class="metric-card-icon-wrapper icon-green">👥</div>
          <div class="metric-card-title">Attendance Count</div>
          <div class="metric-card-value" id="metric-val-attendance">${stats.attendanceCount}</div>
        </div>
      </div>

      <div class="card-grid-custom">
        <div class="dashboard-section-label">Operations &amp; Issuance</div>
        <div class="metric-card-interactive" id="card-kits">
          <div class="metric-card-icon-wrapper icon-purple">🎁</div>
          <div class="metric-card-title">Kits Issued</div>
          <div class="metric-card-value" id="metric-val-kits">${stats.kitsIssued}</div>
        </div>
        <div class="metric-card-interactive" id="card-coupons">
          <div class="metric-card-icon-wrapper icon-pink">🎫</div>
          <div class="metric-card-title">Coupons Issued</div>
          <div class="metric-card-value" id="metric-val-coupons">${stats.couponsIssued}</div>
        </div>
        <div class="metric-card-interactive" id="card-feedback">
          <div class="metric-card-icon-wrapper icon-orange">💬</div>
          <div class="metric-card-title">Feedback Received</div>
          <div class="metric-card-value" id="metric-val-feedback">${stats.feedbackReceived}</div>
        </div>
      </div>

      <div class="dashboard-section-label" style="margin-bottom:12px;display:block;">Analytics Overview</div>
      <div class="analytics-grid">
        <div class="chart-card">
          <div class="chart-card-header">Registration Trends</div>
          <div class="chart-card-body">${regByEvent.length > 0 ? regTrendSVG : '<div class="chart-empty">No registrations yet</div>'}</div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">Attendance Breakdown</div>
          <div class="chart-card-body chart-card-body--center">
            ${attendDonutSVG}
            <div class="chart-legend">
              <span class="legend-dot" style="background:#22c55e"></span>Present
              <span class="legend-dot" style="background:#ef4444;margin-left:12px"></span>Absent
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">Food Distribution</div>
          <div class="chart-card-body chart-card-body--center">
            ${foodSVG}
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${foodPercent}% of coupons distributed</div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">Registrations per Event</div>
          <div class="chart-card-body">${regByEvent.length > 0 ? regBarSVG : '<div class="chart-empty">No event data yet</div>'}</div>
        </div>

        <div class="chart-card">
          <div class="chart-card-header">Participant Category</div>
          <div class="chart-card-body chart-card-body--center">${catSVG}</div>
        </div>
      </div>
    `;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('dashboard', state.user)}
        <div class="main-wrapper">
          ${renderHeader('System Admin Dashboard', true)}
          <main class="content-body">${dashboardHTML}</main>
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

    document.getElementById('topbar-new-event-btn')?.addEventListener('click', () => navigate('#create-event'));
    document.getElementById('card-total-events')?.addEventListener('click', () => openEventListModal());
    document.getElementById('card-total-registrations')?.addEventListener('click', () => openMetricsDetailModal('total_registrations'));
    document.getElementById('card-attendance')?.addEventListener('click', () => openMetricsDetailModal('attendance'));
    document.getElementById('card-kits')?.addEventListener('click', () => openMetricsDetailModal('kits'));
    document.getElementById('card-coupons')?.addEventListener('click', () => openMetricsDetailModal('coupons'));
    document.getElementById('card-feedback')?.addEventListener('click', () => openMetricsDetailModal('feedback'));

  } catch (error) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('dashboard', state.user)}
        <div class="main-wrapper">
          ${renderHeader('System Admin Dashboard', true)}
          <main class="content-body"><div class="alert alert-danger">${error.message}</div></main>
        </div>
      </div>
    `;
  }
}

export async function openMetricsDetailModal(metricType) {
  let modalHolder = document.getElementById('modal-holder');
  if (!modalHolder) {
    modalHolder = document.createElement('div');
    modalHolder.id = 'modal-holder';
    document.body.appendChild(modalHolder);
  }

  modalHolder.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-container" style="max-width:900px; width:95%;">
        <header class="modal-header">
          <h4 class="modal-title" id="metrics-modal-title">Loading details...</h4>
          <button id="close-metrics-modal-btn" class="btn-icon">✖</button>
        </header>
        <div class="modal-body" id="metrics-modal-body" style="max-height: 60vh; overflow-y: auto;">
          <div style="text-align:center; padding:40px;">Loading operational records...</div>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalHolder.innerHTML = '';
    document.removeEventListener('keydown', escapeHandler);
  };

  const escapeHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  document.getElementById('close-metrics-modal-btn')?.addEventListener('click', closeModal);
  modalHolder.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', escapeHandler);

  try {
    const isEventAdmin = state.user?.role === 'admin';
    let events = [];
    let allRegistrations = [];

    if (isEventAdmin) {
      const res = await apiFetch('/api/admin/registrations');
      const data = await res.json();
      const regs = data.registrations || (Array.isArray(data) ? data : []);
      const eventTitle = state.currentEvent?.title || 'Assigned Event';
      regs.forEach(r => {
        allRegistrations.push({ ...r, eventTitle: r.eventId?.title || eventTitle });
      });
      if (state.currentEvent) {
        events = [state.currentEvent];
      }
    } else {
      const rawEvents = await getEvents();
      events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);

      await Promise.all(
        events.map(async (ev) => {
          try {
            const data = await getRegistrations(ev._id);
            const regs = data.registrations || (Array.isArray(data) ? data : []);
            regs.forEach(r => {
              allRegistrations.push({ ...r, eventTitle: ev.title });
            });
          } catch (e) {}
        })
      );
    }

    let titleText = 'Operational Records';
    
    if (metricType === 'total_events') {
      titleText = 'All Operational Events';
      const tableHTML = `
        <table class="table">
          <thead><tr><th>Event Title</th><th>Date</th><th>Venue</th><th>Status</th></tr></thead>
          <tbody>
            ${events.map(e => `
              <tr>
                <td><strong>${e.title}</strong></td>
                <td>${new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                <td>${e.location || e.venue || 'N/A'}</td>
                <td><span class="badge badge-${e.status}">${e.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      document.getElementById('metrics-modal-title').textContent = titleText;
      document.getElementById('metrics-modal-body').innerHTML = tableHTML;
      return;
    }

    if (metricType === 'total_registrations') titleText = 'All Registered Attendees (Read Only)';
    else if (metricType === 'attendance') titleText = 'Live Attendance Registry (Read Only)';
    else if (metricType === 'kits') titleText = 'Kit Distribution Status (Read Only)';
    else if (metricType === 'coupons') titleText = 'Food Coupon Status (Read Only)';
    else if (metricType === 'feedback') titleText = 'Feedback Log (Read Only)';

    let filteredRegs = allRegistrations;
    if (metricType === 'attendance') filteredRegs = allRegistrations.filter(r => r.attended);
    else if (metricType === 'kits') filteredRegs = allRegistrations.filter(r => r.kitIssued);
    else if (metricType === 'coupons') filteredRegs = allRegistrations.filter(r => r.couponIssued || r.foodRedeemed);

    const renderReadonlyRow = (r) => {
      const pName = r.participantName || r.fullName || r.formData?.name || r.formData?.['Full Name'] || r.formData?.['name'] || 'Participant';
      const regId = r.registrationId || (r._id ? `#REG-${String(r._id).substring(18).toUpperCase()}` : 'N/A');
      const pPhone = r.participantPhone || r.formData?.mobile || r.formData?.phone || r.formData?.['Mobile Number'] || r.formData?.['contact'] || 'N/A';
      const evTitle = r.eventTitle || r.eventId?.title || 'Event';
      
      const attBadge = `<span class="badge badge-${r.attended ? 'published' : 'draft'}">${r.attended ? 'Present' : 'Absent'}</span>`;
      const kitBadge = `<span class="badge badge-${r.kitIssued ? 'published' : 'draft'}">${r.kitIssued ? 'Issued' : 'Pending'}</span>`;
      const foodBadge = `<span class="badge badge-${r.couponIssued || r.foodRedeemed ? 'published' : 'draft'}">${r.foodRedeemed ? 'Redeemed' : (r.couponIssued ? 'Issued' : 'Pending')}</span>`;
      
      let timeStr = 'N/A';
      if (r.attendedTime) {
        timeStr = (r.attendedDate ? r.attendedDate + ' ' : '') + r.attendedTime;
      } else if (r.kitIssuedTime) {
        timeStr = (r.kitIssuedDate ? r.kitIssuedDate + ' ' : '') + r.kitIssuedTime;
      } else if (r.registeredAt) {
        timeStr = new Date(r.registeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }

      return `
        <tr>
          <td><strong>${pName}</strong></td>
          <td><span style="font-family:monospace; font-weight:700; color:#4f46e5;">${regId}</span></td>
          <td>${pPhone}</td>
          <td>${evTitle}</td>
          <td>${attBadge}</td>
          <td>${kitBadge}</td>
          <td>${foodBadge}</td>
          <td><span style="font-size:12px; color:#64748b; font-weight:600;">${timeStr}</span></td>
        </tr>
      `;
    };

    const tableHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Participant Name</th>
            <th>Registration ID</th>
            <th>Mobile Number</th>
            <th>Event</th>
            <th>Attendance Status</th>
            <th>Kit Status</th>
            <th>Food Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRegs.length > 0 ? filteredRegs.map(renderReadonlyRow).join('') : `
            <tr>
              <td colspan="8" style="text-align:center; padding:30px; color:#94a3b8; font-weight:600;">No matching records found.</td>
            </tr>
          `}
        </tbody>
      </table>
    `;

    document.getElementById('metrics-modal-title').textContent = titleText;
    document.getElementById('metrics-modal-body').innerHTML = tableHTML;

  } catch (err) {
    document.getElementById('metrics-modal-body').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

export async function openEventListModal() {
  let modalHolder = document.getElementById('modal-holder');
  if (!modalHolder) {
    modalHolder = document.createElement('div');
    modalHolder.id = 'modal-holder';
    document.body.appendChild(modalHolder);
  }

  modalHolder.innerHTML = `
    <div class="modal-overlay" id="event-list-overlay">
      <div class="modal-container" style="max-width:860px;width:95%;">
        <header class="modal-header">
          <h4 class="modal-title">📅 All Events — Select an Event to View Analytics</h4>
          <button id="close-event-list-modal-btn" class="btn-icon">✖</button>
        </header>
        <div class="modal-body" id="event-list-modal-body" style="max-height:65vh;overflow-y:auto;padding:8px 0;">
          <div style="text-align:center;padding:48px;color:#64748b;font-size:14px;">Loading events...</div>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalHolder.innerHTML = '';
    document.removeEventListener('keydown', escapeHandler);
  };

  const escapeHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  document.getElementById('close-event-list-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('event-list-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', escapeHandler);

  try {
    const rawEvents = await getEvents();
    const events = Array.isArray(rawEvents) ? rawEvents : (rawEvents.events || []);
    const body = document.getElementById('event-list-modal-body');

    if (!events || events.length === 0) {
      body.innerHTML = `<div style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;">No events found.</div>`;
      return;
    }

    const statusColor = (s) => s === 'published' ? '#22c55e' : s === 'archived' ? '#94a3b8' : '#f59e0b';
    const statusBg   = (s) => s === 'published' ? '#f0fdf4' : s === 'archived' ? '#f1f5f9' : '#fffbeb';

    body.innerHTML = events.map(ev => {
      const dateStr = ev.date
        ? new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'No Date';
      const venue = ev.location || 'Venue TBD';
      const status = ev.status || 'draft';
      return `
        <div
          class="event-list-row"
          data-event-id="${ev._id}"
          data-event-title="${ev.title.replace(/"/g, '&quot;')}"
          style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background 0.18s;border-radius:8px;margin:2px 8px;"
          onmouseenter="this.style.background='#f8fafc';"
          onmouseleave="this.style.background='transparent';"
        >
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ev.title}</div>
            <div style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:12px;">
              <span>📅 ${dateStr}</span>
              <span>📍 ${venue}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
            <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:${statusBg(status)};color:${statusColor(status)};text-transform:capitalize;border:1px solid ${statusColor(status)}33;">${status}</span>
            <button
              class="btn btn-primary btn-sm event-list-select-btn"
              data-event-id="${ev._id}"
              data-event-title="${ev.title.replace(/"/g, '&quot;')}"
              style="font-size:12px;padding:6px 14px;white-space:nowrap;"
            >View Analytics →</button>
          </div>
        </div>
      `;
    }).join('');

    body.querySelectorAll('.event-list-row, .event-list-select-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-event-id');
        const title = el.getAttribute('data-event-title');
        closeModal();
        renderEventAnalyticsDashboard(id, title);
      });
    });

  } catch (err) {
    const body = document.getElementById('event-list-modal-body');
    if (body) body.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

export async function renderEventAnalyticsDashboard(eventId, eventTitle) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar('dashboard', state.user)}
      <div class="main-wrapper">
        ${renderHeader('Event Analytics', false)}
        <main class="content-body">
          <div style="text-align:center;padding:60px;color:#64748b;font-size:15px;">Loading analytics for <strong>${eventTitle}</strong>...</div>
        </main>
      </div>
    </div>
  `;

  try {
    const res = await apiFetch(`/api/dashboard/stats/${eventId}`);
    const s = await res.json();

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

    const html = `
      <div style="margin-bottom:24px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <button id="back-to-dashboard-btn" class="btn btn-outline btn-sm" style="margin-bottom:12px;">← Back to System Dashboard</button>
          <h2 style="font-size:24px; font-weight:800; color:#0f172a; margin:0;">${s.eventTitle || eventTitle}</h2>
          <div style="font-size:13px; color:#64748b; margin-top:4px;">
            <span>📅 ${formatDate(s.eventDate)}</span> • <span>📍 ${s.eventVenue || 'Main Venue'}</span> • <span class="badge badge-${s.eventStatus}">${s.eventStatus}</span>
          </div>
        </div>
      </div>

      <div class="card-grid-custom" style="grid-template-columns:repeat(4,1fr);">
        <div class="metric-card-interactive">
          <div class="metric-card-icon-wrapper icon-blue">📂</div>
          <div class="metric-card-title">Event Registrations</div>
          <div class="metric-card-value">${s.totalRegistrations || 0}</div>
        </div>
        <div class="metric-card-interactive">
          <div class="metric-card-icon-wrapper icon-green">👥</div>
          <div class="metric-card-title">Attended</div>
          <div class="metric-card-value">${s.attendanceCount || 0}</div>
        </div>
        <div class="metric-card-interactive">
          <div class="metric-card-icon-wrapper icon-purple">🎁</div>
          <div class="metric-card-title">Kits Issued</div>
          <div class="metric-card-value">${s.kitsIssued || 0}</div>
        </div>
        <div class="metric-card-interactive">
          <div class="metric-card-icon-wrapper icon-pink">🎫</div>
          <div class="metric-card-title">Food Coupons</div>
          <div class="metric-card-value">${s.couponsIssued || 0}</div>
        </div>
      </div>
    `;

    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('dashboard', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Event Analytics', false)}
          <main class="content-body">${html}</main>
        </div>
      </div>
    `;

    document.getElementById('back-to-dashboard-btn')?.addEventListener('click', () => renderDashboard());
  } catch (err) {
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('dashboard', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Event Analytics', false)}
          <main class="content-body"><div class="alert alert-danger">${err.message}</div></main>
        </div>
      </div>
    `;
  }
}

// UI and Helper Utilities

export function showAlert(message, type = 'info', duration = 4000) {
  const alertContainer = document.getElementById('global-alert-container') || createAlertContainer();
  const alertEl = document.createElement('div');
  alertEl.className = `global-toast toast-${type}`;
  alertEl.style.cssText = `
    padding: 12px 18px;
    margin-bottom: 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13.5px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    animation: toast-slide-in 0.25s ease-out;
    background: ${type === 'danger' || type === 'error' ? '#fef2f2' : type === 'success' ? '#ecfdf5' : '#eff6ff'};
    color: ${type === 'danger' || type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#2563eb'};
    border: 1px solid ${type === 'danger' || type === 'error' ? '#fecaca' : type === 'success' ? '#a7f3d0' : '#bfdbfe'};
  `;

  const icon = type === 'danger' || type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  alertEl.innerHTML = `
    <span>${icon} ${message}</span>
    <button style="background:none;border:none;cursor:pointer;font-weight:bold;color:inherit;" onclick="this.parentElement.remove()">✕</button>
  `;

  alertContainer.appendChild(alertEl);

  setTimeout(() => {
    if (alertEl.parentNode) {
      alertEl.style.animation = 'toast-fade-out 0.3s ease-out forwards';
      setTimeout(() => alertEl.remove(), 300);
    }
  }, duration);
}

export async function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
  if (!text) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      showAlert(successMsg, 'success');
      return true;
    } catch (err) {}
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 999999);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      showAlert(successMsg, 'success');
      return true;
    }
  } catch (err) {}

  window.prompt('Copy link manually:', text);
  return true;
}

function createAlertContainer() {
  const container = document.createElement('div');
  container.id = 'global-alert-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 420px;
    width: calc(100% - 40px);
  `;
  document.body.appendChild(container);
  return container;
}

export function downloadQRImage(dataUrl, filename = 'qr-code.png') {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadQRCode(dataUrl, filename = 'qr-code.png') {
  downloadQRImage(dataUrl, filename);
}

export function exportToExcelCSV(records = [], filename = 'Exported_Data.csv') {
  const headers = ['Registration ID', 'Participant Name', 'Email', 'Mobile', 'Category', 'Attendance', 'Kit Status', 'Food Status'];
  const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
  const rows = records.map(r => [
    r.registrationId || r._id,
    r.fullName || r.participantName || 'Participant',
    r.email || r.participantEmail || '',
    r.mobile || r.participantPhone || '',
    r.category || 'General',
    r.attended ? 'Checked In' : 'Absent',
    r.kitIssued ? 'Issued' : 'Pending',
    (r.foodRedeemed || r.couponIssued) ? 'Redeemed' : 'Pending'
  ]);

  const csvContent = '\uFEFF' + headers.map(escapeCSV).join(',') + '\n' + rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function initMobileSidebarToggle() {
  setTimeout(() => {
    const toggleBtns = document.querySelectorAll('.mobile-hamburger-btn, #mobile-hamburger-btn, #ops-mobile-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    let backdrop = document.getElementById('sidebar-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'sidebar-backdrop';
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    if (sidebar) {
      toggleBtns.forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          sidebar.classList.toggle('open');
          backdrop.classList.toggle('active');
        };
      });

      backdrop.onclick = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      };

      sidebar.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => {
          sidebar.classList.remove('open');
          backdrop.classList.remove('active');
        });
      });
    }
  }, 50);
}

export function initHeaderBackButtons() {
  setTimeout(() => {
    const backBtns = document.querySelectorAll('.header-back-btn, #header-back-btn');
    backBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.hash = '#admin-dashboard';
        }
      };
    });
  }, 50);
}

export function exportAdminRegistrationsToCSV(records = [], dashboardMetrics = {}, filename = 'Event_Registrations.csv') {
  const summaryLines = [
    `"EVENT DASHBOARD METRICS SUMMARY"`,
    `"Total Registrations","${dashboardMetrics.totalRegistrations || records.length || 0}"`,
    `"Today's Attendance","${dashboardMetrics.todayAttendance || records.filter(r => r.attended).length || 0}"`,
    `"Spot Registrations","${dashboardMetrics.spotRegistrations || records.filter(r => r.category === 'Spot' || r.spotRegistration).length || 0}"`,
    `"Kit Distributed","${dashboardMetrics.kitsIssued || records.filter(r => r.kitIssued).length || 0}"`,
    `"Food Redeemed","${dashboardMetrics.foodRedeemed || records.filter(r => r.foodRedeemed || r.couponIssued).length || 0}"`,
    `""`
  ].join('\n');

  const headers = [
    'Registration ID',
    'Participant Name',
    'Mobile Number',
    'Email Address',
    'Registration Status',
    'Attendance Status',
    'Spot Registration',
    'Kit Distribution',
    'Food Coupon'
  ];

  const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

  const dataRows = records.map(r => {
    const formDataObj = r.formData instanceof Map ? Object.fromEntries(r.formData) : (r.formData || {});
    const name = r.participantName || formDataObj.name || formDataObj.fullName || formDataObj['Full Name'] || 'Participant';
    const mobile = r.participantPhone || formDataObj.mobile || formDataObj.phone || formDataObj['Mobile Number'] || '';
    const email = r.participantEmail || formDataObj.email || formDataObj['Email Address'] || '';
    const regId = r.registrationId || `#REG-${String(r._id || '').substring(18).toUpperCase()}`;

    const regStatus = r.status || 'Registered';
    const attendanceStatus = r.attended ? `Attended (${r.attendedTime || 'Yes'})` : 'Absent';
    const spotStatus = (r.spotRegistration || r.category === 'Spot') ? 'Yes (Spot Walk-in)' : 'No (Pre-registered)';
    const kitStatus = r.kitIssued ? `Issued (${r.kitIssuedTime || 'Yes'})` : 'Pending';
    const foodStatus = (r.foodRedeemed || r.couponIssued) ? `Redeemed (${r.foodRedeemedTime || 'Yes'})` : 'Pending';

    return [
      regId,
      name,
      mobile,
      email,
      regStatus,
      attendanceStatus,
      spotStatus,
      kitStatus,
      foodStatus
    ].map(escapeCSV).join(',');
  });

  const csvContent = '\uFEFF' + summaryLines + '\n' + headers.map(escapeCSV).join(',') + '\n' + dataRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



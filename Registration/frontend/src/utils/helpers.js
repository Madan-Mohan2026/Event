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

/**
 * Helper to download a QR code wrapped in a clean card with a title/heading at the top.
 * Supports food, check-in, admin, and generic QR categories.
 */
export async function downloadQRWithHeader(qrImgSrc, title = 'QR Code', subtitle = '', filename = 'qr-code.png') {
  if (!qrImgSrc) return;

  let dataUrl = qrImgSrc;
  if (typeof qrImgSrc === 'string' && !qrImgSrc.startsWith('data:image/')) {
    try {
      const response = await fetch(qrImgSrc);
      const blob = await response.blob();
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Could not convert QR URL to DataURL, falling back to original URL:', err);
      dataUrl = qrImgSrc;
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = 480;
        const padding = 32;
        const qrSize = 320;

        const lowerTitle = String(title || 'QR Code').toLowerCase();
        let primaryColor = '#4f46e5'; // Indigo default

        if (lowerTitle.includes('food')) {
          primaryColor = '#ea580c'; // Food Orange / Amber
        } else if (lowerTitle.includes('check-in') || lowerTitle.includes('checkin') || lowerTitle.includes('attendance')) {
          primaryColor = '#059669'; // Emerald Green for Check-in
        } else if (lowerTitle.includes('admin')) {
          primaryColor = '#7c3aed'; // Purple for Admin
        }

        const titleText = String(title || 'QR CODE').toUpperCase();
        const subtitleText = subtitle ? String(subtitle).trim() : '';

        const topBannerHeight = 12;
        const titleFontSize = 24;
        const subtitleFontSize = 14;

        let headerHeight = titleFontSize;
        if (subtitleText) {
          headerHeight += 8 + subtitleFontSize;
        }

        const totalHeaderOffset = topBannerHeight + padding + headerHeight + 24;
        const totalHeight = totalHeaderOffset + qrSize + padding + 28;

        canvas.width = width;
        canvas.height = totalHeight;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, totalHeight);

        // Top Color Accent Bar
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, width, topBannerHeight);

        // Card Outer Border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, totalHeight - 2);

        // Draw Title (Heading)
        let currentY = topBannerHeight + padding + 10;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${titleFontSize}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.fillText(titleText, width / 2, currentY);
        currentY += titleFontSize + 6;

        // Draw Subtitle
        if (subtitleText) {
          ctx.fillStyle = '#64748b';
          ctx.font = `600 ${subtitleFontSize}px Inter, system-ui, -apple-system, sans-serif`;
          ctx.fillText(subtitleText, width / 2, currentY);
        }

        // Draw QR Container Box
        const qrBoxX = (width - qrSize) / 2;
        const qrBoxY = totalHeaderOffset;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(qrBoxX, qrBoxY, qrSize, qrSize);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Frame Border around QR
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(qrBoxX, qrBoxY, qrSize, qrSize);

        // Draw QR Image inside frame
        ctx.drawImage(img, qrBoxX + 12, qrBoxY + 12, qrSize - 24, qrSize - 24);

        // Footer Text
        const footerY = qrBoxY + qrSize + 16;
        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 12px Inter, system-ui, -apple-system, sans-serif`;
        ctx.fillText('Official Event QR Code • Scannable Pass', width / 2, footerY);

        const finalDataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = finalDataUrl;
        a.download = filename || `${titleText.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve(finalDataUrl);
      } catch (err) {
        console.error('Failed drawing header on QR canvas, falling back:', err);
        fallbackDownload(qrImgSrc, filename);
        reject(err);
      }
    };

    img.onerror = (err) => {
      console.error('Failed loading QR image for canvas header:', err);
      fallbackDownload(qrImgSrc, filename);
      reject(err);
    };

    img.src = dataUrl;
  });
}

function fallbackDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadQRImage(dataUrl, filename = 'qr-code.png', title = 'QR Code', subtitle = '') {
  if (!dataUrl) return;
  downloadQRWithHeader(dataUrl, title, subtitle, filename);
}

export function downloadQRCode(dataUrl, filename = 'qr-code.png', title = 'QR Code', subtitle = '') {
  downloadQRWithHeader(dataUrl, title, subtitle, filename);
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
    (r.foodRedeemed || r.foodIssued || r.foodTaken || r.couponIssued) ? 'Issued' : 'Not Issued'
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

/**
 * Formats a Date object, ISO timestamp string, or time string into Indian Standard Time (IST - Asia/Kolkata).
 * Ensures consistency across browsers and servers regardless of system time zone.
 */
export function formatISTTime(dateVal, timeStr = '', dateStr = '') {
  // 1. If dateVal is an ISO string or Date object (e.g. attendedAt: "2026-08-31T07:54:42.000Z")
  if (dateVal) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toLowerCase();
    }
  }

  // 2. If only timeStr is provided (or timeStr + dateStr)
  if (timeStr && typeof timeStr === 'string') {
    const trimmed = timeStr.trim();
    if (!trimmed || trimmed === 'N/A' || trimmed === 'Yes') return trimmed;

    // Check if timeStr is already a full ISO string
    if (trimmed.includes('T') || (trimmed.length > 15 && !isNaN(new Date(trimmed).getTime()))) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).toLowerCase();
      }
    }

    // If we have dateStr or today's date, combine with UTC to convert UTC time string into IST
    const datePart = dateStr && dateStr.trim() ? dateStr.trim() : new Date().toISOString().split('T')[0];
    const normalizedDate = datePart.includes('/') ? datePart.split('/').reverse().join('-') : datePart;
    const utcDate = new Date(`${normalizedDate} ${trimmed} UTC`);
    if (!isNaN(utcDate.getTime())) {
      return utcDate.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toLowerCase();
    }

    return trimmed;
  }

  return '';
}

export function formatISTDateTime(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const datePart = d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timePart = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  return `${datePart}, ${timePart}`;
}

export function formatISTDate(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}




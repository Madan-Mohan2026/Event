// Date, Time and Number Formatting Helpers

export function formatDateStr(d) {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTimeStr(d) {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

export function formatDateTime(d) {
  if (!d) return 'N/A';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return `${formatDateStr(dateObj)} at ${formatTimeStr(dateObj)}`;
}

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

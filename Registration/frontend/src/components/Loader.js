// Loader Component Helper

export function renderLoadingSpinner(message = 'Loading data...') {
  return `
    <div class="loader-wrapper" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:14px;color:#64748b;">
      <div class="btn-spinner" style="width:32px;height:32px;border-width:3px;border-color:#4f46e5 transparent #4f46e5 transparent;"></div>
      <div style="font-weight:600;font-size:14px;">${message}</div>
    </div>
  `;
}

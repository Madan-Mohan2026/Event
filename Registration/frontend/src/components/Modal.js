// Universal Modal Helper Component

export function renderModal(id, title, bodyHTML, footerHTML = '') {
  return `
    <div class="modal-overlay" id="${id}">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('${id}').remove()">✕</button>
        </div>
        <div class="modal-body">
          ${bodyHTML}
        </div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    </div>
  `;
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

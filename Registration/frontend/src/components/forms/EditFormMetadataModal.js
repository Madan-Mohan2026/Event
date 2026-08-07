import { updateFormMetadata } from '../../services/formService.js';
import { showAlert } from '../../utils/helpers.js';

export function openEditFormMetadataModal(eventObj, onSuccessCallback) {
  let modalHolder = document.getElementById('modal-holder');
  if (!modalHolder) {
    modalHolder = document.createElement('div');
    modalHolder.id = 'modal-holder';
    document.body.appendChild(modalHolder);
  }

  modalHolder.innerHTML = `
    <div class="edit-form-metadata-overlay" id="edit-metadata-overlay">
      <div class="edit-form-metadata-container">
        <!-- Header -->
        <div class="edit-metadata-header">
          <h3 class="edit-metadata-title">Edit Form Metadata</h3>
          <button type="button" class="edit-metadata-close-btn" id="edit-metadata-close">✖</button>
        </div>

        <!-- Body -->
        <div class="edit-metadata-body">
          <form id="edit-metadata-form">
            <div class="edit-metadata-field">
              <label class="edit-metadata-label">Form Title <span class="required-star">*</span></label>
              <input type="text" id="edit-form-title" class="edit-metadata-input" value="${eventObj.title || ''}" required />
            </div>

            <div class="edit-metadata-field">
              <label class="edit-metadata-label">Description / Subtitle</label>
              <textarea id="edit-form-desc" class="edit-metadata-textarea" rows="4">${eventObj.description || ''}</textarea>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="edit-metadata-footer">
          <button type="button" class="btn-metadata-cancel" id="edit-metadata-cancel">Cancel</button>
          <button type="button" class="btn-metadata-save" id="edit-metadata-save">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalHolder.innerHTML = '';
  };

  document.getElementById('edit-metadata-close')?.addEventListener('click', closeModal);
  document.getElementById('edit-metadata-cancel')?.addEventListener('click', closeModal);

  document.getElementById('edit-metadata-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('edit-metadata-save')?.addEventListener('click', async () => {
    const title = document.getElementById('edit-form-title')?.value.trim();
    const description = document.getElementById('edit-form-desc')?.value.trim() || '';

    if (!title) {
      alert('Form Title is required.');
      return;
    }

    try {
      await updateFormMetadata(eventObj._id, { title, description });
      showAlert(`Form "${title}" metadata updated successfully!`, 'success');
      closeModal();
      if (typeof onSuccessCallback === 'function') {
        onSuccessCallback();
      }
    } catch (err) {
      alert('Failed to update form metadata: ' + err.message);
    }
  });
}

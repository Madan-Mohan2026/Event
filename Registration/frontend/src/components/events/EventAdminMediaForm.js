export function renderEventAdminMediaForm(isEdit, eventObj) {
  const contactNumber = isEdit ? (eventObj.contactNumber || '+91 9876543210') : '+91 9876543210';
  const supportEmail = isEdit ? (eventObj.supportEmail || 'support@rtih.com') : 'support@rtih.com';

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        👤 ADMINISTRATION & MEDIA
      </div>

      <div class="form-grid-2col">
        <div class="form-group-custom">
          <label class="form-label-custom">Contact Number</label>
          <input type="text" id="ev-contact" class="form-control-custom" value="${contactNumber}" placeholder="+91 9876543210" />
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Support Email</label>
          <input type="email" id="ev-email" class="form-control-custom" value="${supportEmail}" placeholder="support@rtih.com" />
        </div>
      </div>

      <div class="form-grid-2col margin-top-12">
        <div class="form-group-custom">
          <label class="form-label-custom">Event Banner Image</label>
          <div class="file-input-wrapper">
            <input type="file" id="ev-banner-file" accept="image/*" class="file-input-hidden" />
            <label for="ev-banner-file" class="file-btn">Choose File</label>
            <span class="file-name-text" id="banner-file-name">No file chosen</span>
          </div>
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Agenda PDF</label>
          <div class="file-input-wrapper">
            <input type="file" id="ev-agenda-file" accept="application/pdf" class="file-input-hidden" />
            <label for="ev-agenda-file" class="file-btn">Choose File</label>
            <span class="file-name-text" id="agenda-file-name">No file chosen</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

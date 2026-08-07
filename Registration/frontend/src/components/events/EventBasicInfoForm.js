export function renderEventBasicInfoForm(isEdit, eventObj) {
  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        📌 BASIC INFORMATION
      </div>
      <div class="form-group-custom">
        <label class="form-label-custom">Event Title <span class="required-star">*</span></label>
        <input type="text" id="ev-title" class="form-control-custom" value="${isEdit ? (eventObj.title || '') : ''}" placeholder="e.g. RTIH Tech Innovation Summit 2026" required />
      </div>

      <div class="form-group-custom">
        <label class="form-label-custom">Summary — <span class="label-subtext">Short description shown on event cards</span></label>
        <input type="text" id="ev-summary" class="form-control-custom" value="${isEdit ? (eventObj.summary || '') : ''}" placeholder="A brief one-liner for your event" />
      </div>

      <div class="form-group-custom">
        <label class="form-label-custom">Description <span class="required-star">*</span></label>
        <textarea id="ev-desc" class="form-control-custom textarea-custom" rows="3" placeholder="Describe your event in detail — agenda, speakers, what to expect..." required>${isEdit ? (eventObj.description || '') : ''}</textarea>
      </div>
    </div>
  `;
}

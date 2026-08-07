export function renderEventVenueForm(isEdit, eventObj) {
  const venue = isEdit ? (eventObj.location || eventObj.venue || '') : '';
  const speaker = isEdit ? (eventObj.speakerDetails || '') : '';

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        📍 VENUE & LOCATION
      </div>

      <div class="form-grid-2col">
        <div class="form-group-custom">
          <label class="form-label-custom">Venue / Location</label>
          <input type="text" id="ev-location" class="form-control-custom" value="${venue}" placeholder="e.g. RTIH Auditorium, Main Campus" />
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Speaker Details</label>
          <input type="text" id="ev-speaker" class="form-control-custom" value="${speaker}" placeholder="e.g. Dr. John Doe (Chief Keynote)" />
        </div>
      </div>
    </div>
  `;
}

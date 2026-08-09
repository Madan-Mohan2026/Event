export function renderEventDateTimeForm(isEdit, eventObj) {
  const formatDateVal = (d) => {
    if (!d) return '';
    try {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().substring(0, 10);
    } catch {
      return String(d).substring(0, 10);
    }
  };

  const formatDateTimeLocal = (d, t) => {
    if (!d) return '';
    try {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      let timeStr = t || '09:00';
      if (timeStr.length > 5) timeStr = timeStr.substring(0, 5);
      return `${year}-${month}-${day}T${timeStr}`;
    } catch {
      return '';
    }
  };

  const startDate = isEdit ? formatDateVal(eventObj?.date) : '';
  const endDate = isEdit ? formatDateVal(eventObj?.endDate) : '';

  const regStartDateTime = isEdit ? formatDateTimeLocal(eventObj?.registrationStart, eventObj?.registrationStartTime) : '';
  const regEndDateTime = isEdit ? formatDateTimeLocal(eventObj?.registrationEnd || eventObj?.registrationDeadline, eventObj?.registrationEndTime) : '';

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        🗓️ DATE & TIME
      </div>

      <!-- Event Start & End Dates -->
      <div class="form-grid-2col" style="margin-top:12px;">
        <div class="form-group-custom">
          <label class="form-label-custom">EVENT DATE <span class="required-star">*</span></label>
          <input type="date" id="ev-date" class="form-control-custom" value="${startDate}" required />
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">EVENT END DATE</label>
          <input type="date" id="ev-enddate" class="form-control-custom" value="${endDate}" />
        </div>
      </div>

      <!-- Registration Start Date & Time (Combined Single Field) -->
      <div class="form-group-custom margin-top-12">
        <label class="form-label-custom">REGISTRATION START DATE & TIME</label>
        <input type="datetime-local" id="ev-reg-start-datetime" class="form-control-custom" value="${regStartDateTime}" />
      </div>

      <!-- Registration End Date & Time (Combined Single Field) -->
      <div class="form-group-custom margin-top-12">
        <label class="form-label-custom">REGISTRATION END DATE & TIME <span class="required-star">*</span></label>
        <input type="datetime-local" id="ev-reg-end-datetime" class="form-control-custom" value="${regEndDateTime}" required />
      </div>
    </div>
  `;
}

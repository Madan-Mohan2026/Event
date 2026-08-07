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

  const startDate = isEdit ? formatDateVal(eventObj?.date) : '';
  const endDate = isEdit ? formatDateVal(eventObj?.endDate) : '';

  const regStartDate = isEdit ? formatDateVal(eventObj?.registrationStart) : '';
  const regStartTime = isEdit ? (eventObj?.registrationStartTime || '') : '';
  const regEndDate = isEdit ? formatDateVal(eventObj?.registrationEnd || eventObj?.registrationDeadline) : '';
  const regEndTime = isEdit ? (eventObj?.registrationEndTime || '') : '';

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

      <!-- Registration Start Date & Time -->
      <div class="form-grid-2col margin-top-12">
        <div class="form-group-custom">
          <label class="form-label-custom">REGISTRATION START DATE</label>
          <input type="date" id="ev-reg-startdate" class="form-control-custom" value="${regStartDate}" />
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">REGISTRATION START TIME</label>
          <input type="time" id="ev-reg-starttime" class="form-control-custom" value="${regStartTime}" />
        </div>
      </div>

      <!-- Registration End Date & Time -->
      <div class="form-grid-2col margin-top-12">
        <div class="form-group-custom">
          <label class="form-label-custom">REGISTRATION END DATE <span class="required-star">*</span></label>
          <input type="date" id="ev-deadline" class="form-control-custom" value="${regEndDate}" required />
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">REGISTRATION END TIME</label>
          <input type="time" id="ev-reg-endtime" class="form-control-custom" value="${regEndTime}" />
        </div>
      </div>
    </div>
  `;
}

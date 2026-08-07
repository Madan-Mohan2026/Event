export function renderEventClassificationForm(isEdit, eventObj) {
  const currentCategory = isEdit ? (eventObj.category || 'Startups') : 'Startups';
  const currentTeamWide = isEdit ? (eventObj.teamWide || 'Innotribes') : 'Innotribes';
  const currentCapacity = isEdit ? (eventObj.capacity || 500) : 500;

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        🏷️ CLASSIFICATION & PARTICIPANT SELECTION
      </div>
      
      <div class="form-grid-2col">
        <div class="form-group-custom">
          <label class="form-label-custom">Participant Type <span class="required-star">*</span></label>
          <select id="ev-category" class="form-control-custom select-custom">
            <option value="Startups" ${currentCategory === 'Startups' ? 'selected' : ''}>Startups</option>
            <option value="MSMEs" ${currentCategory === 'MSMEs' ? 'selected' : ''}>MSMEs</option>
            <option value="Students" ${currentCategory === 'Students' ? 'selected' : ''}>Students</option>
            <option value="Professionals" ${currentCategory === 'Professionals' ? 'selected' : ''}>Professionals</option>
            <option value="Delegates" ${currentCategory === 'Delegates' ? 'selected' : ''}>Delegates</option>
            <option value="DEWE" ${currentCategory === 'DEWE' ? 'selected' : ''}>DEWE</option>
            <option value="General" ${currentCategory === 'General' ? 'selected' : ''}>General</option>
            <option value="All" ${currentCategory === 'All' ? 'selected' : ''}>All</option>
          </select>
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Team Wide <span class="required-star">*</span></label>
          <select id="ev-teamwide" class="form-control-custom select-custom">
            <option value="Innovation" ${currentTeamWide === 'Innovation' ? 'selected' : ''}>Innovation</option>
            <option value="Innotribes" ${currentTeamWide === 'Innotribes' ? 'selected' : ''}>Innotribes</option>
            <option value="Partnerships" ${currentTeamWide === 'Partnerships' ? 'selected' : ''}>Partnerships</option>
            <option value="General" ${currentTeamWide === 'General' ? 'selected' : ''}>General</option>
            <option value="RTIH Hub" ${currentTeamWide === 'RTIH Hub' ? 'selected' : ''}>RTIH Hub</option>
            <option value="Campus Wide" ${currentTeamWide === 'Campus Wide' ? 'selected' : ''}>Campus Wide</option>
          </select>
        </div>
      </div>

      <div class="form-group-custom margin-top-12">
        <label class="form-label-custom">Max Capacity (Seats Available) <span class="required-star">*</span></label>
        <input type="number" id="ev-capacity" class="form-control-custom" value="${currentCapacity}" min="1" required />
      </div>
    </div>
  `;
}

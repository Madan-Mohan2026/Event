export function renderEventClassificationForm(isEdit, eventObj) {
  const currentCategory = isEdit ? (eventObj.category || 'Startups') : 'Startups';
  const currentTeamWide = isEdit ? (eventObj.teamWide || 'Innotribes') : 'Innotribes';
  const currentOrganizerTeam = isEdit ? (eventObj.organizerTeam || eventObj.organizerName || 'All Teams') : 'All Teams';
  const currentEventType = isEdit ? (eventObj.eventType || 'All Event Types') : 'All Event Types';
  const currentCapacity = isEdit ? (eventObj.capacity || 500) : 500;

  const organizerTeams = [
    'All Teams',
    'Amaravathi Hub',
    'Vizag Spoke',
    'Tirupathi Spoke',
    'Rajahmundry Spoke',
    'Vijayawada Spoke',
    'Amanthpur Spoke'
  ];

  const eventTypes = [
    'All Event Types',
    'VDP',
    'Spark',
    'Udhyam'
  ];

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        🏷️ CLASSIFICATION & PARTICIPANT SELECTION
      </div>
      
      <!-- Row 1: Participant Type & Team Wide -->
      <div class="form-grid-2col">
        <div class="form-group-custom">
          <label class="form-label-custom">Participant Type <span class="required-star">*</span></label>
          <select id="ev-category" class="form-control-custom select-custom">
            <option value="Startups" ${currentCategory === 'Startups' ? 'selected' : ''}>Startups</option>
            <option value="MSMEs" ${currentCategory === 'MSMEs' ? 'selected' : ''}>MSMEs</option>
            <option value="Students" ${currentCategory === 'Students' ? 'selected' : ''}>Students</option>
            <option value="All" ${currentCategory === 'All' ? 'selected' : ''}>All</option>
            <option value="Others" ${currentCategory === 'Others' ? 'selected' : ''}>Others</option>
          </select>
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Team Wide <span class="required-star">*</span></label>
          <select id="ev-teamwide" class="form-control-custom select-custom">
            <option value="Innovation" ${currentTeamWide === 'Innovation' ? 'selected' : ''}>Innovation</option>
            <option value="Innotribes" ${currentTeamWide === 'Innotribes' ? 'selected' : ''}>Innotribes</option>
            <option value="Partnership" ${currentTeamWide === 'Partnership' || currentTeamWide === 'Partnerships' ? 'selected' : ''}>Partnership</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Event Organizer & Event Type -->
      <div class="form-grid-2col margin-top-12">
        <div class="form-group-custom">
          <label class="form-label-custom">Event Organizer</label>
          <select id="ev-organizer-team" class="form-control-custom select-custom">
            ${organizerTeams.map(t => `<option value="${t}" ${currentOrganizerTeam === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Event Type</label>
          <select id="ev-event-type" class="form-control-custom select-custom">
            ${eventTypes.map(t => `<option value="${t}" ${currentEventType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Row 3: Max Capacity -->
      <div class="form-group-custom margin-top-12">
        <label class="form-label-custom">Max Capacity (Seats Available) <span class="required-star">*</span></label>
        <input type="number" id="ev-capacity" class="form-control-custom" value="${currentCapacity}" min="1" required />
      </div>
    </div>
  `;
}

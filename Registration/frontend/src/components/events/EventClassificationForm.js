export function renderEventClassificationForm(isEdit, eventObj) {
  const rawCategory = isEdit ? (eventObj.category || eventObj.participantType || 'Startups') : 'Startups';
  const selectedTypes = rawCategory ? rawCategory.split(',').map(s => s.trim()).filter(Boolean) : ['Startups'];

  const allParticipantTypes = ['Startups', 'MSMEs', 'Students', 'All', 'Others'];
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
          <label class="form-label-custom">Participant Type <span class="required-star">*</span> <span style="font-weight:400; font-size:11px; color:#64748b;">(Select multiple)</span></label>
          <div id="ev-participant-types-wrapper" style="display:flex; flex-wrap:wrap; gap:6px; padding:10px 12px; border:2px solid #cbd5e1; border-radius:14px; background:#ffffff; min-height:48px; align-items:center;">
            ${allParticipantTypes.map(t => {
              const isChecked = selectedTypes.includes(t) || (selectedTypes.includes('All') && t === 'All');
              return `
                <label class="pt-chip" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:10px; font-size:12.5px; font-weight:700; border:1.5px solid ${isChecked ? '#4f46e5' : '#e2e8f0'}; background:${isChecked ? '#eef2ff' : '#f8fafc'}; color:${isChecked ? '#4338ca' : '#475569'}; user-select:none; transition:all 0.15s;">
                  <input type="checkbox" class="ev-pt-checkbox" value="${t}" ${isChecked ? 'checked' : ''} style="accent-color:#4f46e5; cursor:pointer; width:15px; height:15px;" />
                  <span>${t}</span>
                </label>
              `;
            }).join('')}
          </div>
          <input type="hidden" id="ev-category" value="${selectedTypes.join(', ')}" />
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

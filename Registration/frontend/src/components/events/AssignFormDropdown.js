export function renderAssignFormDropdown(event, availableForms = [], assignedFormMap = new Map(), assignedFormIdsSet = new Set()) {
  const assignedFormId = event.assignedFormId && String(event.assignedFormId).trim() !== '' ? String(event.assignedFormId).trim() : null;
  const assignedFormObj = assignedFormId ? availableForms.find(f => String(f._id) === assignedFormId) : null;
  const assignedFormTitle = assignedFormObj ? (assignedFormObj.title || 'Assigned Form') : (event.formTitle || null);

  if (assignedFormId && assignedFormTitle) {
    return `
      <div class="assigned-form-badge-container" style="margin: 10px 0; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
          <span style="font-size: 14px;">📋</span>
          <div style="overflow: hidden;">
            <div style="font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Form</div>
            <div style="font-size: 12.5px; font-weight: 700; color: #15803d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${assignedFormTitle}">${assignedFormTitle}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Filter out forms that are already assigned to other events
  const unassignedForms = availableForms.filter(f => {
    const fId = String(f._id || '').trim();
    if (!fId) return false;
    return !assignedFormIdsSet.has(fId);
  });

  const optionsHTML = unassignedForms.length > 0
    ? unassignedForms.map(f => `<option value="${f._id}">${f.title}</option>`).join('')
    : `<option value="" disabled>No unassigned forms available</option>`;

  return `
    <div class="assign-form-box" style="margin: 10px 0; padding: 10px 12px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px;">
      <div style="font-size: 11px; font-weight: 800; color: #c2410c; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
        <span>⚠️</span> Assign Form before publishing
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <select class="form-select-assign-dropdown" data-event-id="${event._id}" style="flex: 1; min-width: 0; border: 1px solid #fed7aa; border-radius: 8px; padding: 6px 8px; font-size: 12px; font-weight: 600; color: #334155; background: #ffffff; outline: none; cursor: pointer;">
          <option value="">Select Form ▼</option>
          ${optionsHTML}
        </select>
        <button type="button" class="btn-assign-form-submit" data-event-id="${event._id}" style="background: #ea580c; color: #ffffff; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 6px rgba(234,88,12,0.3);">Assign</button>
      </div>
    </div>
  `;
}

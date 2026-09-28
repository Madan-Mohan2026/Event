export function renderEventBasicInfoForm(isEdit, eventObj) {
  const titleVal = (isEdit && eventObj) ? (eventObj.title || '').replace(/"/g, '&quot;') : '';
  const summaryVal = (isEdit && eventObj) ? (eventObj.summary || '').replace(/"/g, '&quot;') : '';
  const descVal = (isEdit && eventObj) ? (eventObj.description || '') : '';
  
  let storedRef = null;
  let storedMeal = null;
  if (eventObj && eventObj._id) {
    try {
      storedRef = localStorage.getItem(`event_refreshment_type_${eventObj._id}`);
      storedMeal = localStorage.getItem(`event_food_meal_option_${eventObj._id}`);
    } catch (e) {}
  }
  const refreshmentType = (isEdit && eventObj && (eventObj.refreshmentType || storedRef)) ? (eventObj.refreshmentType || storedRef) : 'food';
  const foodMealOption = (isEdit && eventObj && (eventObj.foodMealOption || storedMeal)) ? (eventObj.foodMealOption || storedMeal) : 'both';

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        📌 BASIC INFORMATION
      </div>
      <div class="form-group-custom">
        <label class="form-label-custom">Event Title <span class="required-star">*</span></label>
        <input type="text" id="ev-title" class="form-control-custom" value="${titleVal}" placeholder="e.g. RTIH Tech Innovation Summit 2026" required />
      </div>

      <div class="form-group-custom">
        <label class="form-label-custom">Summary <span class="required-star">*</span> — <span class="label-subtext">Short description shown on event cards</span></label>
        <input type="text" id="ev-summary" class="form-control-custom" value="${summaryVal}" placeholder="A brief one-liner for your event" required />
      </div>

      <div class="form-group-custom">
        <label class="form-label-custom">Description <span class="required-star">*</span></label>
        <textarea id="ev-desc" class="form-control-custom textarea-custom" rows="3" placeholder="Describe your event in detail — agenda, speakers, what to expect..." required>${descVal}</textarea>
      </div>

      <div class="form-group-custom" style="margin-top:16px;">
        <label class="form-label-custom" for="ev-refreshment-type">Refreshment Type <span class="required-star">*</span></label>
        <select id="ev-refreshment-type" class="form-control-custom">
          <option value="none" ${refreshmentType === 'none' ? 'selected' : ''}>No Refreshments</option>
          <option value="food" ${refreshmentType === 'food' ? 'selected' : ''}>Food (Lunch)</option>
          <option value="tea_snacks" ${refreshmentType === 'tea_snacks' ? 'selected' : ''}>Tea &amp; Snacks</option>
        </select>
        <span style="font-size:11.5px; color:#64748b; margin-top:4px; display:block;">
          Event-level refreshment configuration. Participants do not select refreshments during registration.
        </span>
      </div>

      <!-- Conditional Veg / Non-Veg Configuration for Food (Lunch) -->
      <div id="ev-food-config-container" style="display:${refreshmentType === 'food' ? 'block' : 'none'}; margin-top:12px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px 16px;">
        <label class="form-label-custom" for="ev-meal-options">Veg / Non-Veg Meal Configuration</label>
        <select id="ev-meal-options" class="form-control-custom">
          <option value="both" ${foodMealOption === 'both' ? 'selected' : ''}>Veg &amp; Non-Veg Options Available</option>
          <option value="veg_only" ${foodMealOption === 'veg_only' ? 'selected' : ''}>Vegetarian Only</option>
          <option value="standard" ${foodMealOption === 'standard' ? 'selected' : ''}>Standard Buffet / Catering</option>
        </select>
        <span style="font-size:11px; color:#64748b; margin-top:4px; display:block;">
          Configures catering desk distribution. Preserves existing Food QR verification workflow.
        </span>
      </div>

      <!-- Tea & Snacks Notice -->
      <div id="ev-tea-snacks-info-container" style="display:${refreshmentType === 'tea_snacks' ? 'block' : 'none'}; margin-top:12px; background:#eff6ff; border:1.5px solid #bfdbfe; border-radius:12px; padding:12px 16px; color:#1e40af; font-size:12.5px; font-weight:600;">
        ☕ Configured for Tea &amp; Snacks distribution. Veg / Non-Veg meal options are hidden for this event.
      </div>

      <!-- No Refreshments Notice -->
      <div id="ev-no-refreshments-info-container" style="display:${refreshmentType === 'none' ? 'block' : 'none'}; margin-top:12px; background:#f1f5f9; border:1.5px dashed #cbd5e1; border-radius:12px; padding:12px 16px; color:#475569; font-size:12.5px; font-weight:600;">
        🚫 No Refreshments configured. Refreshment QR verification will be disabled for this event.
      </div>
    </div>
  `;
}

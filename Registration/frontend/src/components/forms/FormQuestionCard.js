import { SUPPORTED_FIELD_TYPES, normalizeFieldType } from '../../utils/formHelpers.js';

export function renderFormQuestionCard(field, idx, totalFields) {
  const currentType = normalizeFieldType(field.fieldType || field.type);
  const isRequired = field.required === true;
  const isCoreField = field.name === 'participantName' || field.name === 'participantEmail' || field.name === 'fullName' || field.name === 'email';
  const hasOptions = ['dropdown', 'radio', 'checkbox', 'multiple_choice'].includes(currentType);

  const typeOptionsHTML = SUPPORTED_FIELD_TYPES.map(t => `
    <option value="${t.value}" ${currentType === t.value ? 'selected' : ''}>${t.label}</option>
  `).join('');

  const optionsStr = Array.isArray(field.options) ? field.options.join(', ') : (field.options || '');

  return `
    <div class="question-card-box" data-idx="${idx}">
      <div class="question-card-top-row">
        <div class="question-card-badge-label">
          QUESTION ${idx + 1} ${isCoreField ? '<span class="core-field-tag">(Core System Field)</span>' : ''}
        </div>
        <div class="question-card-controls-right">
          <button type="button" class="btn-q-control move-up-btn" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Up">↑ Up</button>
          <button type="button" class="btn-q-control move-down-btn" data-idx="${idx}" ${idx === totalFields - 1 ? 'disabled' : ''} title="Move Down">↓ Down</button>
          <button type="button" class="btn-q-control duplicate-q-btn" data-idx="${idx}" title="Duplicate Field">📋 Duplicate</button>
          ${!isCoreField ? `
            <button type="button" class="btn-q-control btn-q-delete delete-q-btn" data-idx="${idx}" title="Delete Field">🗑️ Delete</button>
          ` : ''}
        </div>
      </div>

      <div class="question-card-grid-2col">
        <div class="q-form-group">
          <label class="q-form-label">QUESTION LABEL</label>
          <input type="text" class="q-form-input q-label-input" value="${field.label || ''}" data-idx="${idx}" placeholder="e.g. Full Name" />
        </div>

        <div class="q-form-group">
          <label class="q-form-label">FIELD TYPE</label>
          <select class="q-form-select q-type-select" data-idx="${idx}" ${isCoreField ? 'disabled' : ''}>
            ${typeOptionsHTML}
          </select>
        </div>
      </div>

      <div class="question-card-grid-2col margin-top-12">
        <div class="q-form-group">
          <label class="q-form-label">PLACEHOLDER TEXT</label>
          <input type="text" class="q-form-input q-placeholder-input" value="${field.placeholder || ''}" data-idx="${idx}" placeholder="e.g. Enter your response..." />
        </div>

        ${hasOptions ? `
          <div class="q-form-group">
            <label class="q-form-label">OPTIONS (Comma-separated)</label>
            <input type="text" class="q-form-input q-options-input" value="${optionsStr}" data-idx="${idx}" placeholder="Option 1, Option 2, Option 3" />
          </div>
        ` : ''}
      </div>

      <div class="question-card-bottom-row">
        <label class="required-checkbox-label">
          <input type="checkbox" class="q-required-checkbox" data-idx="${idx}" ${isRequired ? 'checked' : ''} ${isCoreField ? 'disabled checked' : ''} />
          <span>Required Question</span>
        </label>
      </div>
    </div>
  `;
}

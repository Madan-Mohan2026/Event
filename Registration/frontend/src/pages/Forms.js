import { state, navigate } from '../app.js';
import { fetchAllForms, saveFormSchema, deleteFormSchema } from '../services/formService.js';
import { renderSidebar } from '../components/Sidebar.js';
import { renderHeader } from '../components/Header.js';
import { showAlert } from '../utils/helpers.js';
import { notifyFormCreated, notifyFormDeleted } from '../services/notificationService.js';
import { renderFormCard } from '../components/forms/FormCard.js';
import { renderFormQuestionCard } from '../components/forms/FormQuestionCard.js';
import { openEditFormMetadataModal } from '../components/forms/EditFormMetadataModal.js';
import { openCreateEventModal } from '../components/events/CreateEventModal.js';
import { API_BASE } from '../utils/constants.js';

let activeFormTab = 'all'; // 'all' or 'unassigned'

export async function renderForms() {
  const hash = window.location.hash || '#forms';

  if (hash.startsWith('#preview-form') || hash.startsWith('#form-preview')) {
    const parts = hash.split('/');
    const eventId = parts[1];
    return renderFormPreviewView(eventId);
  }

  if (hash.startsWith('#form-studio')) {
    const parts = hash.split('/');
    const eventId = parts[1];
    return renderFormStudioView(eventId);
  }

  return renderFormsListView();
}

// --- Step 2: Forms List View (Reference Image 1) ---
export async function renderFormsListView() {
  const app = document.getElementById('app');

  try {
    const events = await fetchAllForms();
    state.events = events;

    const filteredEvents = events.filter(e => {
      const isAssigned = e.isAssigned === true || (!!e.assignedFormId && String(e.assignedFormId).trim() !== '');
      if (activeFormTab === 'unassigned') return !isAssigned;
      return true;
    });

    // Sort newest forms first so newly created forms always appear in the first row
    filteredEvents.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String(b._id || '').localeCompare(String(a._id || ''));
    });

    const cardsHTML = filteredEvents.length > 0
      ? filteredEvents.map(ev => renderFormCard(ev)).join('')
      : `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 18px; border: 1px solid #e2e8f0; color: #64748b;">
          <p style="font-size:18px; font-weight:700; margin-bottom:8px; color:#0f172a;">No forms found in this view.</p>
          <p style="font-size:14px; margin-bottom:20px;">Click <strong>+ New Form</strong> in the topbar to create an event with an auto-generated registration form.</p>
          <button class="btn btn-primary" id="forms-empty-new-btn">+ New Form</button>
        </div>
      `;

    const html = `
      <div class="forms-container-main" style="max-width: 1200px; margin: 0 auto;">
        <!-- Tabs: All Forms / Unassigned Forms -->
        <div class="forms-page-header-tabs">
          <button type="button" class="forms-tab-btn ${activeFormTab === 'all' ? 'active' : ''}" id="tab-all-forms">
            All Forms
          </button>
          <button type="button" class="forms-tab-btn ${activeFormTab === 'unassigned' ? 'active' : ''}" id="tab-unassigned-forms">
            Unassigned Forms
          </button>
        </div>

        <!-- Search Bar & Create New Form Action Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap;">
          <div class="forms-search-bar-wrapper" style="flex:1; min-width:280px; margin:0;">
            <input type="text" id="forms-search-input" class="forms-search-input" placeholder="Search forms..." />
          </div>
          <button id="btn-create-new-form" class="btn btn-primary" style="background:#4f46e5; color:#ffffff; border:none; padding:12px 22px; border-radius:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(79,70,229,0.3); font-size:14px;">
            + Create New Form
          </button>
        </div>

        <!-- Cards Grid ONLY -->
        <div class="forms-cards-grid" id="forms-cards-grid">
          ${cardsHTML}
        </div>
      </div>
    `;

    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('forms', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Forms', false)}
          <main class="content-body">${html}</main>
        </div>
      </div>
    `;

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('#login');
    });

    // Create New Form button listener -> opens Dynamic Form Studio for a brand-new form card
    document.getElementById('btn-create-new-form')?.addEventListener('click', () => {
      navigate('#form-studio/new');
    });

    // Topbar "+ New Form" button opens Create Event modal with auto form creation
    document.getElementById('topbar-new-event-btn')?.addEventListener('click', () => {
      openCreateEventModal(null, renderFormsListView);
    });

    document.getElementById('forms-empty-new-btn')?.addEventListener('click', () => {
      openCreateEventModal(null, renderFormsListView);
    });

    // Tab bindings
    document.getElementById('tab-all-forms')?.addEventListener('click', () => {
      activeFormTab = 'all';
      renderFormsListView();
    });

    document.getElementById('tab-unassigned-forms')?.addEventListener('click', () => {
      activeFormTab = 'unassigned';
      renderFormsListView();
    });

    // Search filter
    document.getElementById('forms-search-input')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const cardEls = document.querySelectorAll('.form-card-container');
      cardEls.forEach(card => {
        const title = card.querySelector('.form-card-title')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(q) ? 'flex' : 'none';
      });
    });

    // Action button bindings
    // 👁️ View Button -> Opens Read-Only Form Preview (Freeze Mode)
    document.querySelectorAll('.view-form-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        navigate(`#preview-form/${id}`);
      });
    });

    // ✏️ Edit Button -> Opens Dynamic Form Studio
    document.querySelectorAll('.edit-form-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        navigate(`#form-studio/${id}`);
      });
    });

    // 🗑️ Delete Button
    document.querySelectorAll('.delete-form-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const ev = state.events.find(e => e._id === id);
        if (confirm(`Are you sure you want to reset the registration form for "${ev?.title || 'this event'}"?`)) {
          try {
            await deleteFormSchema(id);
            notifyFormDeleted(ev?.title || 'Form');
            showAlert('Form schema reset successfully.', 'success');
            renderFormsListView();
          } catch (err) {
            showAlert('Failed to reset form: ' + err.message, 'danger');
          }
        }
      });
    });

  } catch (err) {
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('forms', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Forms', false)}
          <main class="content-body"><div class="alert alert-danger">${err.message}</div></main>
        </div>
      </div>
    `;
  }
}

// --- Step 3 & 4: Dynamic Form Builder (Section & Field Studio) ---
export async function renderFormStudioView(eventId) {
  const app = document.getElementById('app');

  try {
    const events = await fetchAllForms();
    let isNewForm = !eventId || eventId === 'new';
    let selectedEvent = null;

    if (!isNewForm) {
      selectedEvent = events.find(e => String(e._id) === String(eventId));
    }

    if (!selectedEvent) {
      isNewForm = true;
      selectedEvent = {
        _id: `new_${Date.now()}`,
        title: '',
        description: '',
        formSchema: []
      };
    }

    if (!selectedEvent.formSchema) {
      selectedEvent.formSchema = [];
    }

    // Normalize formSchema: if schema is flat fields without section wrappers, wrap them into a single section
    const hasSections = selectedEvent.formSchema.some(item => item && (item.isSection === true || Array.isArray(item.fields)));
    if (!hasSections && selectedEvent.formSchema.length > 0) {
      selectedEvent.formSchema = [{
        id: `sec_${Date.now()}`,
        isSection: true,
        title: 'Form Section',
        description: '',
        fields: [...selectedEvent.formSchema]
      }];
    }

    const fieldTypesList = [
      { value: 'short_text', label: 'Short Text' },
      { value: 'long_text', label: 'Long Text' },
      { value: 'number', label: 'Number' },
      { value: 'email', label: 'Email Address' },
      { value: 'phone', label: 'Phone Number' },
      { value: 'date', label: 'Date' },
      { value: 'time', label: 'Time' },
      { value: 'datetime', label: 'Date & Time' },
      { value: 'dropdown', label: 'Dropdown / Select' },
      { value: 'radio', label: 'Radio Buttons' },
      { value: 'checkbox', label: 'Checkboxes' },
      { value: 'file', label: 'File Upload' }
    ];

    const drawStudioUI = () => {
      const sections = selectedEvent.formSchema || [];

      const sectionsHTML = sections.length > 0
        ? sections.map((sec, sIdx) => {
            const fields = Array.isArray(sec.fields) ? sec.fields : [];
            
            const fieldsHTML = fields.length > 0
              ? fields.map((field, fIdx) => {
                  const currentType = (field.fieldType || field.type || 'short_text').toLowerCase();
                  const hasOptions = ['dropdown', 'select', 'radio', 'checkbox', 'checkboxes'].includes(currentType);
                  const options = Array.isArray(field.options) ? field.options : [];

                  const typeSelectOptionsHTML = fieldTypesList.map(t => `
                    <option value="${t.value}" ${currentType === t.value ? 'selected' : ''}>${t.label}</option>
                  `).join('');

                  const optionsListHTML = options.map((opt, oIdx) => `
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                      <input type="text" class="opt-val-input" data-sidx="${sIdx}" data-fidx="${fIdx}" data-oidx="${oIdx}" value="${opt}" placeholder="Option ${oIdx + 1}" style="flex:1; border:1px solid #cbd5e1; border-radius:8px; padding:6px 10px; font-size:13px;" />
                      <button type="button" class="remove-opt-btn" data-sidx="${sIdx}" data-fidx="${fIdx}" data-oidx="${oIdx}" style="background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; padding:6px 10px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer;">
                        Remove
                      </button>
                    </div>
                  `).join('');

                  return `
                    <div class="field-builder-card" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:14px; padding:16px 18px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                      <!-- Field Header Row -->
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                        <span style="font-size:11px; font-weight:800; color:#4f46e5; text-transform:uppercase; letter-spacing:0.5px;">FIELD ${fIdx + 1}</span>
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                          <button type="button" class="move-field-up-btn" data-sidx="${sIdx}" data-fidx="${fIdx}" ${fIdx === 0 ? 'disabled' : ''} style="padding:4px 10px; font-size:11px; font-weight:700; border:1px solid #cbd5e1; border-radius:6px; background:#fff; cursor:pointer;">↑ Up</button>
                          <button type="button" class="move-field-down-btn" data-sidx="${sIdx}" data-fidx="${fIdx}" ${fIdx === fields.length - 1 ? 'disabled' : ''} style="padding:4px 10px; font-size:11px; font-weight:700; border:1px solid #cbd5e1; border-radius:6px; background:#fff; cursor:pointer;">↓ Down</button>
                          <button type="button" class="duplicate-field-btn" data-sidx="${sIdx}" data-fidx="${fIdx}" style="padding:4px 10px; font-size:11px; font-weight:700; border:1px solid #c7d2fe; border-radius:6px; background:#eef2ff; color:#4338ca; cursor:pointer;">📋 Duplicate</button>
                          <button type="button" class="delete-field-btn" data-sidx="${sIdx}" data-fidx="${fIdx}" style="padding:4px 10px; font-size:11px; font-weight:700; border:1px solid #fecdd3; border-radius:6px; background:#fff1f2; color:#e11d48; cursor:pointer;">🗑️ Delete</button>
                        </div>
                      </div>

                      <!-- Field Label & Type Row -->
                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                        <div>
                          <label style="font-size:11.5px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Field Label *</label>
                          <input type="text" class="field-label-input" data-sidx="${sIdx}" data-fidx="${fIdx}" value="${field.label || ''}" placeholder="Enter field label..." style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13.5px; font-weight:700; color:#0f172a;" />
                        </div>
                        <div>
                          <label style="font-size:11.5px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Field Type *</label>
                          <select class="field-type-select" data-sidx="${sIdx}" data-fidx="${fIdx}" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; font-weight:600; background:#ffffff;">
                            ${typeSelectOptionsHTML}
                          </select>
                        </div>
                      </div>

                      <!-- Placeholder & Help Text Row -->
                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                        <div>
                          <label style="font-size:11.5px; font-weight:700; color:#64748b; display:block; margin-bottom:4px;">Placeholder Text</label>
                          <input type="text" class="field-placeholder-input" data-sidx="${sIdx}" data-fidx="${fIdx}" value="${field.placeholder || ''}" placeholder="e.g. Enter value..." style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:7px 10px; font-size:13px;" />
                        </div>
                        <div>
                          <label style="font-size:11.5px; font-weight:700; color:#64748b; display:block; margin-bottom:4px;">Help Text / Description</label>
                          <input type="text" class="field-help-input" data-sidx="${sIdx}" data-fidx="${fIdx}" value="${field.helpText || ''}" placeholder="e.g. Additional instructions" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:7px 10px; font-size:13px;" />
                        </div>
                      </div>

                      <!-- Options Manager (Choice Fields) -->
                      ${hasOptions ? `
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px;">
                          <label style="font-size:11.5px; font-weight:800; color:#4338ca; display:block; margin-bottom:8px;">CHOICE OPTIONS</label>
                          <div style="margin-bottom:8px;">
                            ${optionsListHTML || '<p style="font-size:12px; color:#64748b; margin:0 0 6px 0;">No options added yet.</p>'}
                          </div>
                          <button type="button" class="add-option-btn" data-sidx="${sIdx}" data-fidx="${fIdx}" style="background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                            + Add Option
                          </button>
                        </div>
                      ` : ''}

                      <!-- Required Toggle -->
                      <div style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" class="field-required-cb" data-sidx="${sIdx}" data-fidx="${fIdx}" ${field.required ? 'checked' : ''} style="width:16px; height:16px; accent-color:#4f46e5; cursor:pointer;" />
                        <label style="font-size:12.5px; font-weight:700; color:#334155; cursor:pointer;">Required Field</label>
                      </div>
                    </div>
                  `;
                }).join('')
              : `
                <div style="text-align:center; padding:24px; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:12px; color:#64748b;">
                  <p style="font-size:13px; font-weight:600; margin:0 0 4px 0;">No fields in this section yet.</p>
                  <p style="font-size:12px; margin:0;">Click <strong>+ Add Field</strong> below to add fields to this section.</p>
                </div>
              `;

            return `
              <div class="section-builder-card" style="background:#ffffff; border-radius:20px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.04); border:1.5px solid #e2e8f0; margin-bottom:24px;">
                <!-- Section Header Row -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid #f1f5f9; flex-wrap:wrap; gap:10px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="background:#e0e7ff; color:#4338ca; font-size:12px; font-weight:800; padding:4px 12px; border-radius:8px; letter-spacing:0.5px;">SECTION ${sIdx + 1}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <button type="button" class="move-sec-up-btn" data-sidx="${sIdx}" ${sIdx === 0 ? 'disabled' : ''} style="padding:6px 12px; font-size:12px; font-weight:700; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; cursor:pointer;">↑ Move Up</button>
                    <button type="button" class="move-sec-down-btn" data-sidx="${sIdx}" ${sIdx === sections.length - 1 ? 'disabled' : ''} style="padding:6px 12px; font-size:12px; font-weight:700; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; cursor:pointer;">↓ Move Down</button>
                    <button type="button" class="delete-sec-btn" data-sidx="${sIdx}" style="padding:6px 12px; font-size:12px; font-weight:700; border-radius:8px; border:1px solid #fecdd3; background:#fff1f2; color:#e11d48; cursor:pointer;">🗑️ Delete Section</button>
                  </div>
                </div>

                <!-- Section Inputs -->
                <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                  <div>
                    <label style="font-size:12px; font-weight:800; color:#334155; display:block; margin-bottom:4px;">Section Title *</label>
                    <input type="text" class="sec-title-input" data-sidx="${sIdx}" value="${sec.title || ''}" placeholder="Enter section title..." style="width:100%; border:1.5px solid #cbd5e1; border-radius:10px; padding:10px 14px; font-size:15px; font-weight:800; color:#0f172a;" />
                  </div>
                  <div>
                    <label style="font-size:12px; font-weight:700; color:#64748b; display:block; margin-bottom:4px;">Section Description (Optional)</label>
                    <input type="text" class="sec-desc-input" data-sidx="${sIdx}" value="${sec.description || ''}" placeholder="Enter optional section description..." style="width:100%; border:1px solid #cbd5e1; border-radius:10px; padding:8px 12px; font-size:13px; color:#475569;" />
                  </div>
                </div>

                <!-- Fields Stack inside Section -->
                <div style="margin-bottom:16px;">
                  ${fieldsHTML}
                </div>

                <!-- Add Field Button inside Section -->
                <button type="button" class="add-field-to-sec-btn" data-sidx="${sIdx}" style="width:100%; background:#f8fafc; border:1.5px dashed #6366f1; color:#4f46e5; padding:12px; border-radius:12px; font-size:13.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                  ➕ Add Field to Section ${sIdx + 1}
                </button>
              </div>
            `;
          }).join('')
        : `
          <div style="text-align:center; padding:50px 20px; background:#ffffff; border-radius:20px; border:2px dashed #cbd5e1; color:#64748b; margin-bottom:24px;">
            <p style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:6px;">No sections created yet</p>
            <p style="font-size:13.5px; margin-bottom:20px;">Click <strong>+ Add New Section</strong> below to begin building your custom form sections and fields.</p>
          </div>
        `;

      const html = `
        <div class="form-designer-container" style="max-width:880px; margin:0 auto; padding-bottom:60px;">
          <!-- Top Header Card -->
          <div class="form-designer-header-card" style="background:#ffffff; border-radius:20px; padding:24px 28px; box-shadow:0 4px 20px rgba(0,0,0,0.04); border:1px solid #e2e8f0; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <span style="font-size:11px; font-weight:800; color:#4f46e5; letter-spacing:1px; text-transform:uppercase;">📝 DYNAMIC FORM BUILDER</span>
              <button type="button" id="back-to-forms-btn" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#334155; padding:8px 16px; border-radius:12px; font-weight:700; font-size:13px; cursor:pointer;">
                ← Back to Forms
              </button>
            </div>

            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:6px;">Form Name *</label>
              <input type="text" id="studio-form-title-input" value="${selectedEvent.title || ''}" placeholder="Enter form name (e.g. Annual Summit Form)" style="font-size:18px; font-weight:800; color:#0f172a; border:1.5px solid #cbd5e1; border-radius:12px; padding:12px 16px; width:100%; box-shadow:inset 0 1px 2px rgba(0,0,0,0.03);" />
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:6px;">Form Description (Optional)</label>
              <textarea id="studio-form-desc-input" rows="2" placeholder="Enter optional form description..." style="font-size:13.5px; color:#334155; border:1.5px solid #cbd5e1; border-radius:12px; padding:10px 14px; width:100%; font-family:inherit;">${selectedEvent.description || ''}</textarea>
            </div>
          </div>

          <!-- Sections Stack -->
          <div id="studio-sections-stack">
            ${sectionsHTML}
          </div>

          <!-- Add Section & Bottom Actions -->
          <div style="display:flex; flex-direction:column; gap:16px; margin-top:24px;">
            <button type="button" id="add-new-section-btn" style="width:100%; background:#ffffff; border:2px dashed #6366f1; color:#4f46e5; padding:16px; border-radius:16px; font-size:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; box-shadow:0 2px 8px rgba(99,102,241,0.05);">
              ➕ Add New Section
            </button>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-top:8px;">
              <button type="button" id="preview-form-btn" style="background:#f1f5f9; color:#334155; border:1.5px solid #cbd5e1; padding:14px 22px; border-radius:14px; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                👁️ Live Preview
              </button>

              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" id="save-draft-btn" style="background:#ffffff; color:#4f46e5; border:1.5px solid #c7d2fe; padding:14px 22px; border-radius:14px; font-size:14px; font-weight:800; cursor:pointer;">
                  💾 Save as Draft
                </button>
                <button type="button" id="save-form-config-btn" style="background:linear-gradient(135deg,#6366f1,#4f46e5); color:#ffffff; border:none; padding:14px 28px; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                  ✓ Save Form
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      app.innerHTML = `
        <div class="admin-layout">
          ${renderSidebar('forms', state.user)}
          <div class="main-wrapper">
            ${renderHeader('Form Builder', false)}
            <main class="content-body">${html}</main>
          </div>
        </div>
      `;

      // Event Bindings

      // Logout
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        state.token = null;
        state.user = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('#login');
      });

      // Back button
      document.getElementById('back-to-forms-btn')?.addEventListener('click', () => {
        navigate('#forms');
      });

      // Form Title & Description Input listeners
      document.getElementById('studio-form-title-input')?.addEventListener('input', (e) => {
        selectedEvent.title = e.target.value;
      });
      document.getElementById('studio-form-desc-input')?.addEventListener('input', (e) => {
        selectedEvent.description = e.target.value;
      });

      // Section Title & Description Input listeners
      document.querySelectorAll('.sec-title-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          if (selectedEvent.formSchema[sIdx]) {
            selectedEvent.formSchema[sIdx].title = e.target.value;
          }
        });
      });
      document.querySelectorAll('.sec-desc-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          if (selectedEvent.formSchema[sIdx]) {
            selectedEvent.formSchema[sIdx].description = e.target.value;
          }
        });
      });

      // Move Section Up / Down / Delete
      document.querySelectorAll('.move-sec-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          if (sIdx > 0) {
            const temp = selectedEvent.formSchema[sIdx];
            selectedEvent.formSchema[sIdx] = selectedEvent.formSchema[sIdx - 1];
            selectedEvent.formSchema[sIdx - 1] = temp;
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.move-sec-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          if (sIdx < selectedEvent.formSchema.length - 1) {
            const temp = selectedEvent.formSchema[sIdx];
            selectedEvent.formSchema[sIdx] = selectedEvent.formSchema[sIdx + 1];
            selectedEvent.formSchema[sIdx + 1] = temp;
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.delete-sec-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          selectedEvent.formSchema.splice(sIdx, 1);
          drawStudioUI();
        });
      });

      // Add New Section
      document.getElementById('add-new-section-btn')?.addEventListener('click', () => {
        selectedEvent.formSchema.push({
          id: `sec_${Date.now()}`,
          isSection: true,
          title: `Section ${selectedEvent.formSchema.length + 1}`,
          description: '',
          fields: []
        });
        drawStudioUI();
      });

      // Add Field to Section
      document.querySelectorAll('.add-field-to-sec-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const targetSec = selectedEvent.formSchema[sIdx];
          if (targetSec) {
            if (!Array.isArray(targetSec.fields)) targetSec.fields = [];
            targetSec.fields.push({
              id: `field_${Date.now()}`,
              name: `field_${Date.now()}`,
              label: 'Untitled Field',
              fieldType: 'short_text',
              type: 'short_text',
              required: false,
              placeholder: '',
              helpText: '',
              options: ['Option 1', 'Option 2']
            });
            drawStudioUI();
          }
        });
      });

      // Field Level Listeners (Label, Type, Placeholder, Help, Required)
      document.querySelectorAll('.field-label-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]) {
            selectedEvent.formSchema[sIdx].fields[fIdx].label = e.target.value;
          }
        });
      });
      document.querySelectorAll('.field-type-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]) {
            selectedEvent.formSchema[sIdx].fields[fIdx].fieldType = e.target.value;
            selectedEvent.formSchema[sIdx].fields[fIdx].type = e.target.value;
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.field-placeholder-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]) {
            selectedEvent.formSchema[sIdx].fields[fIdx].placeholder = e.target.value;
          }
        });
      });
      document.querySelectorAll('.field-help-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]) {
            selectedEvent.formSchema[sIdx].fields[fIdx].helpText = e.target.value;
          }
        });
      });
      document.querySelectorAll('.field-required-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]) {
            selectedEvent.formSchema[sIdx].fields[fIdx].required = e.target.checked;
          }
        });
      });

      // Field Options Listeners (Edit, Add, Remove Option)
      document.querySelectorAll('.opt-val-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          const oIdx = parseInt(e.target.getAttribute('data-oidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]?.options) {
            selectedEvent.formSchema[sIdx].fields[fIdx].options[oIdx] = e.target.value;
          }
        });
      });
      document.querySelectorAll('.add-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          const targetField = selectedEvent.formSchema[sIdx]?.fields[fIdx];
          if (targetField) {
            if (!Array.isArray(targetField.options)) targetField.options = [];
            targetField.options.push(`Option ${targetField.options.length + 1}`);
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.remove-opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          const oIdx = parseInt(e.target.getAttribute('data-oidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields[fIdx]?.options) {
            selectedEvent.formSchema[sIdx].fields[fIdx].options.splice(oIdx, 1);
            drawStudioUI();
          }
        });
      });

      // Move Field Up / Down / Duplicate / Delete
      document.querySelectorAll('.move-field-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          const fields = selectedEvent.formSchema[sIdx]?.fields;
          if (fields && fIdx > 0) {
            const temp = fields[fIdx];
            fields[fIdx] = fields[fIdx - 1];
            fields[fIdx - 1] = temp;
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.move-field-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          const fields = selectedEvent.formSchema[sIdx]?.fields;
          if (fields && fIdx < fields.length - 1) {
            const temp = fields[fIdx];
            fields[fIdx] = fields[fIdx + 1];
            fields[fIdx + 1] = temp;
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.duplicate-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          const sourceField = selectedEvent.formSchema[sIdx]?.fields[fIdx];
          if (sourceField) {
            const clonedField = {
              ...JSON.parse(JSON.stringify(sourceField)),
              id: `field_${Date.now()}`,
              name: `field_${Date.now()}`,
              label: `${sourceField.label || 'Field'} (Copy)`
            };
            selectedEvent.formSchema[sIdx].fields.splice(fIdx + 1, 0, clonedField);
            drawStudioUI();
          }
        });
      });
      document.querySelectorAll('.delete-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const fIdx = parseInt(e.target.getAttribute('data-fidx'), 10);
          if (selectedEvent.formSchema[sIdx]?.fields) {
            selectedEvent.formSchema[sIdx].fields.splice(fIdx, 1);
            drawStudioUI();
          }
        });
      });

      // Live Preview Button
      document.getElementById('preview-form-btn')?.addEventListener('click', () => {
        openLivePreviewModal(selectedEvent);
      });

      // Save Handler (Save Form & Save Draft)
      const handleSave = async (isDraft = false) => {
        try {
          const titleInput = document.getElementById('studio-form-title-input');
          const descInput = document.getElementById('studio-form-desc-input');
          const customTitle = titleInput ? titleInput.value.trim() : selectedEvent.title;
          const customDesc = descInput ? descInput.value.trim() : (selectedEvent.description || '');

          if (!customTitle) {
            showAlert('Please enter a form name before saving.', 'danger');
            return;
          }

          selectedEvent.title = customTitle;
          selectedEvent.description = customDesc;

          const isValidObjectId = selectedEvent._id && /^[0-9a-fA-F]{24}$/.test(String(selectedEvent._id));

          if (isNewForm || !isValidObjectId) {
            const createRes = await fetch(`${API_BASE}/api/forms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token || localStorage.getItem('admin_token')}`
              },
              body: JSON.stringify({
                title: customTitle,
                description: customDesc,
                formSchema: selectedEvent.formSchema,
                fields: selectedEvent.formSchema
              })
            });
            const newFormDoc = await createRes.json();
            if (!createRes.ok) {
              throw new Error(newFormDoc.error || 'Failed to create form in database.');
            }
          } else {
            await saveFormSchema(selectedEvent._id, selectedEvent.formSchema, customTitle, customDesc);
          }

          notifyFormCreated(customTitle);
          showAlert(isDraft ? 'Form draft saved successfully!' : 'Form saved successfully!', 'success');
          if (!isDraft) {
            navigate('#forms');
          }
        } catch (err) {
          showAlert('Failed to save form: ' + err.message, 'danger');
        }
      };

      document.getElementById('save-draft-btn')?.addEventListener('click', () => handleSave(true));
      document.getElementById('save-form-config-btn')?.addEventListener('click', () => handleSave(false));
    };

    drawStudioUI();
  } catch (err) {
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('forms', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Form Builder', false)}
          <main class="content-body"><div class="alert alert-danger">${err.message}</div></main>
        </div>
      </div>
    `;
  }
}

// Live Preview Modal
function openLivePreviewModal(formObj) {
  const existingModal = document.getElementById('live-preview-modal-holder');
  if (existingModal) existingModal.remove();

  const modalHolder = document.createElement('div');
  modalHolder.id = 'live-preview-modal-holder';

  const sections = formObj.formSchema || [];

  const previewSectionsHTML = sections.length > 0
    ? sections.map((sec, sIdx) => {
        const fields = Array.isArray(sec.fields) ? sec.fields : (sec.isSection ? [] : [sec]);
        const secTitle = sec.title || `Section ${sIdx + 1}`;

        const fieldsHTML = fields.map((field, fIdx) => {
          const type = (field.fieldType || field.type || 'short_text').toLowerCase();
          const isReq = field.required === true;
          const reqMark = isReq ? '<span style="color:#ef4444;">*</span>' : '';
          const helpHTML = field.helpText ? `<p style="font-size:11.5px; color:#64748b; margin:4px 0 0 0;">${field.helpText}</p>` : '';

          let inputHTML = '';
          if (type === 'long_text' || type === 'textarea' || type === 'paragraph') {
            inputHTML = `<textarea class="form-control" rows="3" placeholder="${field.placeholder || ''}" disabled style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc;"></textarea>`;
          } else if (type === 'dropdown' || type === 'select') {
            const opts = (field.options || ['Option 1', 'Option 2']).map(o => `<option>${o}</option>`).join('');
            inputHTML = `<select class="form-control" disabled style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc;"><option value="">-- Select --</option>${opts}</select>`;
          } else if (type === 'radio') {
            const opts = (field.options || ['Option 1', 'Option 2']).map(o => `<label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#334155;"><input type="radio" disabled style="accent-color:#4f46e5;" /><span>${o}</span></label>`).join('');
            inputHTML = `<div style="display:flex; flex-direction:column; gap:8px;">${opts}</div>`;
          } else if (type === 'checkbox' || type === 'checkboxes') {
            if (Array.isArray(field.options) && field.options.length > 1) {
              const opts = field.options.map(o => `<label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#334155;"><input type="checkbox" disabled style="accent-color:#4f46e5;" /><span>${o}</span></label>`).join('');
              inputHTML = `<div style="display:flex; flex-direction:column; gap:8px;">${opts}</div>`;
            } else {
              inputHTML = `<div style="display:flex; align-items:center; gap:8px;"><input type="checkbox" disabled style="width:18px; height:18px; accent-color:#4f46e5;" /><span style="font-size:13px; font-weight:600; color:#334155;">${field.label}</span></div>`;
            }
          } else if (type === 'file') {
            inputHTML = `<input type="file" disabled style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:8px 12px; font-size:13px; background:#f8fafc;" />`;
          } else {
            inputHTML = `<input type="text" placeholder="${field.placeholder || ''}" disabled style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc;" />`;
          }

          return `
            <div style="margin-bottom:18px;">
              <label style="font-weight:700; color:#334155; font-size:13.5px; margin-bottom:6px; display:block;">${field.label || 'Field'} ${reqMark}</label>
              ${inputHTML}
              ${helpHTML}
            </div>
          `;
        }).join('');

        return `
          <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:16px; padding:22px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <div style="margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid #f1f5f9;">
              <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">${secTitle}</h3>
              ${sec.description ? `<p style="font-size:13px; color:#64748b; margin:0; line-height:1.4;">${sec.description}</p>` : ''}
            </div>
            <div>${fieldsHTML || '<p style="font-size:13px; color:#94a3b8; font-style:italic;">No fields in this section.</p>'}</div>
          </div>
        `;
      }).join('')
    : `
      <div style="text-align:center; padding:40px 20px; background:#ffffff; border-radius:16px; border:2px dashed #cbd5e1; color:#64748b;">
        <p style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:6px;">No sections to preview</p>
        <p style="font-size:13px; margin:0;">Add sections and fields to see the live form preview.</p>
      </div>
    `;

  modalHolder.innerHTML = `
    <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;">
      <div style="background:#f8fafc; border-radius:24px; max-width:680px; width:100%; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.3);">
        
        <!-- Modal Header -->
        <div style="background:#ffffff; padding:18px 24px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:10px; font-weight:800; color:#4f46e5; letter-spacing:0.5px; text-transform:uppercase;">LIVE FORM PREVIEW</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:2px 0 0 0;">${formObj.title || 'Form Preview'}</h3>
          </div>
          <button type="button" id="close-preview-modal-btn" style="background:#f1f5f9; border:none; color:#64748b; width:34px; height:34px; border-radius:50%; font-size:16px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>

        <!-- Modal Scroll Body -->
        <div style="padding:24px; overflow-y:auto; flex:1;">
          ${formObj.description ? `
            <div style="background:#ffffff; border-radius:14px; padding:14px 18px; margin-bottom:20px; border:1px solid #e2e8f0;">
              <p style="font-size:13.5px; color:#475569; margin:0; line-height:1.5;">${formObj.description}</p>
            </div>
          ` : ''}

          ${previewSectionsHTML}
        </div>

        <!-- Modal Footer -->
        <div style="background:#ffffff; padding:14px 24px; border-top:1px solid #e2e8f0; text-align:right;">
          <button type="button" id="close-preview-modal-footer-btn" style="background:#4f46e5; color:#ffffff; border:none; padding:10px 20px; border-radius:12px; font-size:13.5px; font-weight:800; cursor:pointer;">Close Preview</button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modalHolder);

  const closePreview = () => modalHolder.remove();
  document.getElementById('close-preview-modal-btn')?.addEventListener('click', closePreview);
  document.getElementById('close-preview-modal-footer-btn')?.addEventListener('click', closePreview);
}

// --- Step 5: Read-Only Form Preview View (Freeze Mode) ---
export async function renderFormPreviewView(eventId) {
  const app = document.getElementById('app');

  try {
    const events = await fetchAllForms();
    const selectedEvent = events.find(e => String(e._id) === String(eventId)) || {
      _id: eventId,
      title: 'Registration Form Preview',
      description: 'Registration form preview in read-only / freeze mode.',
      formSchema: []
    };

    const formSchema = Array.isArray(selectedEvent.formSchema) ? selectedEvent.formSchema : [];

    const hasSections = formSchema.some(item => item && (item.isSection === true || Array.isArray(item.fields)));

    let sectionsHTML = '';
    if (hasSections) {
      sectionsHTML = formSchema.map((sec, sIdx) => {
        const fields = Array.isArray(sec.fields) ? sec.fields : (sec.isSection ? [] : [sec]);
        const secTitle = sec.title || `Section ${sIdx + 1}`;

        const fieldsHTML = fields.map((field, fIdx) => {
          const type = (field.fieldType || field.type || 'short_text').toLowerCase();
          const isReq = field.required === true;
          const reqMark = isReq ? '<span style="color:#ef4444; font-weight:700;">*</span>' : '';
          const helpHTML = field.helpText ? `<p style="font-size:11.5px; color:#64748b; margin:4px 0 0 0;">${field.helpText}</p>` : '';

          let inputHTML = '';
          if (type === 'long_text' || type === 'textarea' || type === 'paragraph') {
            inputHTML = `<textarea class="form-control" rows="3" placeholder="${field.placeholder || ''}" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc; color:#64748b; cursor:not-allowed; resize:none;"></textarea>`;
          } else if (type === 'dropdown' || type === 'select') {
            const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `<option value="${opt}">${opt}</option>`).join('');
            inputHTML = `<select class="form-control" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc; color:#64748b; cursor:not-allowed;"><option value="">-- Select --</option>${optionsHTML}</select>`;
          } else if (type === 'radio') {
            const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `<label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#475569; cursor:not-allowed;"><input type="radio" disabled style="accent-color:#4f46e5;" /><span>${opt}</span></label>`).join('');
            inputHTML = `<div style="display:flex; flex-direction:column; gap:8px;">${optionsHTML}</div>`;
          } else if (type === 'checkbox' || type === 'checkboxes') {
            inputHTML = `<div style="display:flex; align-items:center; gap:8px;"><input type="checkbox" disabled style="width:18px; height:18px; accent-color:#4f46e5;" /><span style="font-size:13px; color:#475569; font-weight:600;">${field.label}</span></div>`;
          } else {
            inputHTML = `<input type="text" class="form-control" placeholder="${field.placeholder || ''}" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc; color:#64748b; cursor:not-allowed;" />`;
          }

          return `
            <div style="margin-bottom:16px;">
              <label style="font-weight:700; color:#0f172a; font-size:13.5px; margin-bottom:6px; display:block;">${field.label} ${reqMark}</label>
              ${inputHTML}
              ${helpHTML}
            </div>
          `;
        }).join('');

        return `
          <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:18px; padding:22px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <div style="margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid #f1f5f9;">
              <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">${secTitle}</h3>
              ${sec.description ? `<p style="font-size:13px; color:#64748b; margin:0; line-height:1.4;">${sec.description}</p>` : ''}
            </div>
            <div>${fieldsHTML || '<p style="font-size:13px; color:#94a3b8; font-style:italic;">No fields in this section.</p>'}</div>
          </div>
        `;
      }).join('');
    } else {
      sectionsHTML = formSchema.length > 0
        ? formSchema.map((field, idx) => {
            return `
              <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:16px; padding:20px; margin-bottom:16px;">
                <label style="font-weight:700; color:#0f172a; font-size:14px; margin-bottom:8px; display:block;">${field.label}</label>
                <input type="text" placeholder="${field.placeholder || ''}" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc;" />
              </div>
            `;
          }).join('')
        : `<p style="text-align:center; color:#64748b;">No questions in this form schema.</p>`;
    }

    const html = `
      <div class="form-preview-container" style="max-width:800px; margin:0 auto; padding-bottom:60px;">
        <div style="background:#f8fafc; border-radius:20px; border:1px solid #e2e8f0; padding:24px; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
          <div style="text-align:center; padding:12px 0 20px 0; border-bottom:1px dashed #cbd5e1; margin-bottom:20px;">
            <span style="font-size:11px; font-weight:800; color:#4f46e5; letter-spacing:1px; text-transform:uppercase;">OFFICIAL APPLICANT REGISTRATION FORM</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:4px 0;">${selectedEvent.title}</h3>
            <p style="font-size:13px; color:#64748b; margin:0;">${selectedEvent.description || 'Applicant Registration Fields'}</p>
          </div>

          ${sectionsHTML}

          <div style="margin-top:24px; padding:16px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; text-align:center; color:#1e40af; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span>🔒</span> Application is in freeze (read-only) mode. Form fields cannot be edited here.
          </div>
        </div>
      </div>
    `;

    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('forms', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Form Preview', false)}
          <main class="content-body">${html}</main>
        </div>
      </div>
    `;

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('#login');
    });

  } catch (err) {
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('forms', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Form Preview', false)}
          <main class="content-body"><div class="alert alert-danger">${err.message}</div></main>
        </div>
      </div>
    `;
  }
}

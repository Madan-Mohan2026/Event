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

// --- Step 3 & 4: Form Studio / Designer View (Reference Image 2) ---
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
        title: 'New Registration Form',
        formSchema: []
      };
    }

    if (!selectedEvent.formSchema) {
      selectedEvent.formSchema = [];
    }

    const drawStudioUI = () => {
      const questionsHTML = (selectedEvent.formSchema && selectedEvent.formSchema.length > 0)
        ? selectedEvent.formSchema.map((field, idx) =>
            renderFormQuestionCard(field, idx, selectedEvent.formSchema.length)
          ).join('')
        : `
          <div style="text-align:center; padding:40px 20px; background:#ffffff; border-radius:16px; border:2px dashed #cbd5e1; color:#64748b; margin-bottom:20px;">
            <p style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:6px;">No questions added yet</p>
            <p style="font-size:13px; margin-bottom:16px;">Click <strong>+ Add Question</strong> below to start adding fields to your registration form.</p>
          </div>
        `;

      const html = `
        <div class="form-designer-container">
          <!-- Top Header Card with Editable Title -->
          <div class="form-designer-header-card" style="background:#ffffff; border-radius:20px; padding:24px 28px; box-shadow:0 4px 20px rgba(0,0,0,0.04); border:1px solid #e2e8f0; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px; flex-wrap:wrap;">
              <div style="flex:1; min-width:280px;">
                <div class="form-designer-badge-text" style="font-size:11px; font-weight:800; color:#4f46e5; letter-spacing:0.5px; margin-bottom:6px;">
                  📝 REGISTRATION FORM DESIGNER
                </div>
                <div style="margin-bottom:8px;">
                  <input type="text" id="studio-form-title-input" value="${selectedEvent.title}" placeholder="Enter form title..." style="font-size:22px; font-weight:900; color:#0f172a; border:1.5px solid #cbd5e1; border-radius:12px; padding:8px 14px; width:100%; max-width:520px; background:#ffffff; box-shadow:inset 0 1px 2px rgba(0,0,0,0.03);" />
                </div>
                <p class="form-designer-subtitle" style="font-size:13px; color:#64748b; margin:0;">
                  Customize the registration questions applicants will complete when registering for this form.
                </p>
              </div>
              <button type="button" class="btn-back-to-events" id="back-to-forms-btn" style="white-space:nowrap; background:#f1f5f9; border:1px solid #cbd5e1; color:#334155; padding:8px 16px; border-radius:12px; font-weight:700; font-size:13px; cursor:pointer;">
                ← Back to Forms
              </button>
            </div>
          </div>

          <!-- Question Cards Stack -->
          <div id="studio-questions-stack">
            ${questionsHTML}
          </div>

          <!-- Bottom Action Controls -->
          <div class="form-designer-bottom-actions">
            <button type="button" id="add-new-question-btn" class="btn-add-question">
              ➕ Add New Question
            </button>
            <button type="button" id="save-form-config-btn" class="btn-save-form-config">
              ✓ Save Form Configuration
            </button>
          </div>
        </div>
      `;

      app.innerHTML = `
        <div class="admin-layout">
          ${renderSidebar('forms', state.user)}
          <div class="main-wrapper">
            ${renderHeader('Form Studio', false)}
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

      // Back to Forms button
      document.getElementById('back-to-forms-btn')?.addEventListener('click', () => {
        navigate('#forms');
      });

      // Topbar "+ New Form" button
      document.getElementById('topbar-new-event-btn')?.addEventListener('click', () => {
        openCreateEventModal(null, () => navigate('#forms'));
      });

      // Question Label inputs
      document.querySelectorAll('.q-label-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (selectedEvent.formSchema[idx]) {
            selectedEvent.formSchema[idx].label = e.target.value;
          }
        });
      });

      // Question Placeholder inputs
      document.querySelectorAll('.q-placeholder-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (selectedEvent.formSchema[idx]) {
            selectedEvent.formSchema[idx].placeholder = e.target.value;
          }
        });
      });

      // Question Options inputs
      document.querySelectorAll('.q-options-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (selectedEvent.formSchema[idx]) {
            const rawOpts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            selectedEvent.formSchema[idx].options = rawOpts;
          }
        });
      });

      // Field Type selects
      document.querySelectorAll('.q-type-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (selectedEvent.formSchema[idx]) {
            selectedEvent.formSchema[idx].fieldType = e.target.value;
            selectedEvent.formSchema[idx].type = e.target.value;
            drawStudioUI();
          }
        });
      });

      // Required Checkboxes
      document.querySelectorAll('.q-required-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (selectedEvent.formSchema[idx]) {
            selectedEvent.formSchema[idx].required = e.target.checked;
          }
        });
      });

      // Move Up
      document.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (idx > 0) {
            const temp = selectedEvent.formSchema[idx];
            selectedEvent.formSchema[idx] = selectedEvent.formSchema[idx - 1];
            selectedEvent.formSchema[idx - 1] = temp;
            drawStudioUI();
          }
        });
      });

      // Move Down
      document.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (idx < selectedEvent.formSchema.length - 1) {
            const temp = selectedEvent.formSchema[idx];
            selectedEvent.formSchema[idx] = selectedEvent.formSchema[idx + 1];
            selectedEvent.formSchema[idx + 1] = temp;
            drawStudioUI();
          }
        });
      });

      // Duplicate Question
      document.querySelectorAll('.duplicate-q-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          const sourceField = selectedEvent.formSchema[idx];
          if (sourceField) {
            const clonedField = {
              ...JSON.parse(JSON.stringify(sourceField)),
              name: `field_${Date.now()}`,
              label: `${sourceField.label || 'Question'} (Copy)`
            };
            selectedEvent.formSchema.splice(idx + 1, 0, clonedField);
            drawStudioUI();
          }
        });
      });

      // Delete Question
      document.querySelectorAll('.delete-q-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          selectedEvent.formSchema.splice(idx, 1);
          drawStudioUI();
        });
      });

      // Add New Question
      document.getElementById('add-new-question-btn')?.addEventListener('click', () => {
        selectedEvent.formSchema.push({
          name: `field_${Date.now()}`,
          label: 'Untitled Question',
          fieldType: 'short_text',
          type: 'text',
          required: false,
          placeholder: ''
        });
        drawStudioUI();
      });

      // Form Title Input listener
      document.getElementById('studio-form-title-input')?.addEventListener('input', (e) => {
        selectedEvent.title = e.target.value;
      });

      // Save Form Configuration
      document.getElementById('save-form-config-btn')?.addEventListener('click', async () => {
        try {
          const titleInput = document.getElementById('studio-form-title-input');
          const customTitle = titleInput ? titleInput.value.trim() : selectedEvent.title;
          if (customTitle) {
            selectedEvent.title = customTitle;
          }

          const isValidObjectId = selectedEvent._id && /^[0-9a-fA-F]{24}$/.test(String(selectedEvent._id));

          if (isNewForm || !isValidObjectId) {
            const createRes = await fetch(`${API_BASE}/api/forms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token || localStorage.getItem('admin_token')}`
              },
              body: JSON.stringify({
                title: customTitle || 'New Registration Form',
                formSchema: selectedEvent.formSchema
              })
            });
            const newFormDoc = await createRes.json();
            if (!createRes.ok) {
              throw new Error(newFormDoc.error || 'Failed to create form in database.');
            }
          } else {
            await saveFormSchema(selectedEvent._id, selectedEvent.formSchema, customTitle);
          }

          notifyFormCreated(customTitle || selectedEvent?.title || 'Registration Form');
          showAlert('Form configuration saved successfully!', 'success');
          navigate('#forms');
        } catch (err) {
          showAlert('Failed to save form configuration: ' + err.message, 'danger');
        }
      });
    };

    drawStudioUI();
  } catch (err) {
    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar('forms', state.user)}
        <div class="main-wrapper">
          ${renderHeader('Form Studio', false)}
          <main class="content-body"><div class="alert alert-danger">${err.message}</div></main>
        </div>
      </div>
    `;
  }
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

    const fieldsHTML = formSchema.length > 0
      ? formSchema.map((field, idx) => {
          const type = (field.fieldType || field.type || 'short_text').toLowerCase();
          const isReq = field.required === true;
          const reqMark = isReq ? '<span style="color:#ef4444; font-weight:700;">*</span>' : '';
          const isCoreField = field.name === 'participantName' || field.name === 'participantEmail' || field.name === 'fullName' || field.name === 'email';

          let inputElementHTML = '';

          if (type === 'long_text' || type === 'textarea' || type === 'paragraph') {
            inputElementHTML = `
              <textarea class="form-control" rows="3" placeholder="${field.placeholder || 'e.g. Enter detailed response...'}" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc; color:#64748b; cursor:not-allowed; resize:none;"></textarea>
            `;
          } else if (type === 'dropdown' || type === 'select') {
            const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `<option value="${opt}">${opt}</option>`).join('');
            inputElementHTML = `
              <select class="form-control" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc; color:#64748b; cursor:not-allowed;">
                <option value="">-- Select ${field.label} --</option>
                ${optionsHTML}
              </select>
            `;
          } else if (type === 'radio') {
            const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `
              <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#475569; cursor:not-allowed; opacity:0.85;">
                <input type="radio" disabled style="accent-color:#4f46e5; cursor:not-allowed;" />
                <span>${opt}</span>
              </label>
            `).join('');
            inputElementHTML = `
              <div style="display:flex; flex-direction:column; gap:8px; padding:6px 0;">
                ${optionsHTML}
              </div>
            `;
          } else if (type === 'checkbox') {
            inputElementHTML = `
              <div style="display:flex; align-items:center; gap:8px; padding:4px 0;">
                <input type="checkbox" disabled style="width:18px; height:18px; accent-color:#4f46e5; cursor:not-allowed;" />
                <span style="font-size:13px; color:#475569; font-weight:600; cursor:not-allowed;">${field.placeholder || 'Check this option'}</span>
              </div>
            `;
          } else {
            let inputType = 'text';
            if (type === 'email') inputType = 'email';
            if (type === 'date') inputType = 'date';
            if (type === 'time') inputType = 'time';

            inputElementHTML = `
              <input type="${inputType}" class="form-control" placeholder="${field.placeholder || 'e.g. Enter your response...'}" disabled readonly style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#f8fafc; color:#64748b; cursor:not-allowed;" />
            `;
          }

          return `
            <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.02); position:relative;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-size:11px; font-weight:800; color:#64748b; letter-spacing:0.5px; text-transform:uppercase;">
                  QUESTION ${idx + 1} ${isCoreField ? '<span style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:6px; font-size:10px; margin-left:6px;">System Core</span>' : ''}
                </div>
                <span style="font-size:11px; font-weight:700; color:#059669; background:#ecfdf5; padding:3px 10px; border-radius:20px; border:1px solid #a7f3d0; display:inline-flex; align-items:center; gap:4px;">
                  🔒 Freeze Mode
                </span>
              </div>

              <label style="font-weight:700; color:#0f172a; font-size:14px; margin-bottom:8px; display:block;">
                ${field.label} ${reqMark}
              </label>

              ${inputElementHTML}
            </div>
          `;
        }).join('')
      : `
        <div style="text-align:center; padding:40px 20px; background:#ffffff; border-radius:16px; border:2px dashed #cbd5e1; color:#64748b; margin-bottom:20px;">
          <p style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:6px;">No questions in this form</p>
          <p style="font-size:13px; color:#64748b;">No form fields have been added yet.</p>
        </div>
      `;

    const html = `
      <div class="form-preview-container" style="max-width:800px; margin:0 auto; padding-bottom:60px;">
        <!-- Frozen Form Fields Container -->
        <div style="background:#f8fafc; border-radius:20px; border:1px solid #e2e8f0; padding:24px; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
          <div style="text-align:center; padding:12px 0 20px 0; border-bottom:1px dashed #cbd5e1; margin-bottom:20px;">
            <span style="font-size:11px; font-weight:800; color:#4f46e5; letter-spacing:1px; text-transform:uppercase;">OFFICIAL APPLICANT REGISTRATION FORM</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:4px 0;">${selectedEvent.title}</h3>
            <p style="font-size:13px; color:#64748b; margin:0;">${selectedEvent.description || 'Applicant Registration Fields'}</p>
          </div>

          ${fieldsHTML}

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

    // Back button
    document.getElementById('preview-back-btn')?.addEventListener('click', () => {
      window.history.back();
    });

    // Edit in Form Studio button
    document.getElementById('preview-edit-studio-btn')?.addEventListener('click', () => {
      navigate(`#form-studio/${selectedEvent._id}`);
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

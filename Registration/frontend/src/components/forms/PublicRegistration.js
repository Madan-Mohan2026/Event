import { apiFetch } from '../../services/api.js';
import { getPublicBaseUrl, buildQrUrl } from '../../utils/qrHelpers.js';
import { resolveImageUrl, getEventAbbreviation } from '../../utils/eventHelpers.js';
import { showAlert } from '../../utils/helpers.js';
import { getFieldBehavior, getAttributesForBehavior, validateFieldValue } from '../../utils/validation.js';

export async function renderPublicRegistrationPage(eventId) {
  const app = document.getElementById('app');

  try {
    const res = await apiFetch(`/api/events/${eventId}`);
    if (!res.ok) {
      throw new Error('Event not found or registration is currently closed.');
    }
    const event = await res.json();

    const hasForm = (event.assignedFormId && String(event.assignedFormId).trim() !== '') || (Array.isArray(event.formSchema) && event.formSchema.length > 0);
    if (!hasForm || event.status !== 'published') {
      app.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 20px;">
          <div style="max-width: 480px; width: 100%; background: #ffffff; border-radius: 20px; padding: 40px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Registration Unavailable</h2>
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">Registration is not available for this event because no form has been assigned or the event is not published yet.</p>
          </div>
        </div>
      `;
      return;
    }

    const formSchema = Array.isArray(event.formSchema) ? event.formSchema : [];

    const fieldsHTML = formSchema.map((field, idx) => {
      const type = (field.fieldType || field.type || 'short_text').toLowerCase();
      const behavior = getFieldBehavior(field);
      const isReq = field.required === true;
      const reqMark = isReq ? '<span style="color:#ef4444;">*</span>' : '';
      const fieldId = `dyn-field-${idx}`;

      if (type === 'long_text' || type === 'textarea' || type === 'paragraph') {
        return `
          <div class="form-group" style="margin-bottom:18px;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:6px; display:block;">${field.label} ${reqMark}</label>
            <textarea id="${fieldId}" name="${field.name || fieldId}" class="form-control" rows="3" placeholder="${field.placeholder || ''}" ${isReq ? 'required' : ''} style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px;"></textarea>
          </div>
        `;
      } else if (type === 'dropdown' || type === 'select') {
        const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `<option value="${opt}">${opt}</option>`).join('');
        return `
          <div class="form-group" style="margin-bottom:18px;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:6px; display:block;">${field.label} ${reqMark}</label>
            <select id="${fieldId}" name="${field.name || fieldId}" class="form-control" ${isReq ? 'required' : ''} style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px; background:#fff;">
              <option value="">-- Select ${field.label} --</option>
              ${optionsHTML}
            </select>
          </div>
        `;
      } else if (type === 'radio') {
        const optionsHTML = (field.options || ['Option 1', 'Option 2']).map((opt, oIdx) => `
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#334155; cursor:pointer;">
            <input type="radio" name="${field.name || fieldId}" value="${opt}" ${isReq && oIdx === 0 ? 'required' : ''} style="accent-color:#4f46e5;" />
            <span>${opt}</span>
          </label>
        `).join('');
        return `
          <div class="form-group" style="margin-bottom:18px;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:8px; display:block;">${field.label} ${reqMark}</label>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${optionsHTML}
            </div>
          </div>
        `;
      } else if (type === 'checkbox') {
        return `
          <div class="form-group" style="margin-bottom:18px; display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="${fieldId}" name="${field.name || fieldId}" style="width:18px; height:18px; accent-color:#4f46e5; cursor:pointer;" ${isReq ? 'required' : ''} />
            <label for="${fieldId}" style="font-weight:600; color:#334155; font-size:13px; cursor:pointer;">${field.label} ${reqMark}</label>
          </div>
        `;
      } else {
        const attrStr = getAttributesForBehavior(behavior);

        return `
          <div class="form-group" style="margin-bottom:18px;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:6px; display:block;">${field.label} ${reqMark}</label>
            <input ${attrStr} id="${fieldId}" name="${field.name || fieldId}" class="form-control" placeholder="${field.placeholder || ''}" ${isReq ? 'required' : ''} style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:10px 14px; font-size:14px;" />
          </div>
        `;
      }
    }).join('');

    app.innerHTML = `
      <div style="min-height:100vh; width:100%; background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); display:flex; align-items:flex-start; justify-content:center; padding:40px 16px; overflow-y:auto; box-sizing:border-box;">
        <div style="background:#ffffff; border-radius:24px; max-width:560px; width:100%; padding:36px; box-shadow:0 25px 60px rgba(0,0,0,0.35); margin:20px auto 60px auto;">
          <!-- Event Banner / Title Header -->
          <div style="text-align:center; margin-bottom:28px;">
            ${event.bannerImage ? `<img src="${resolveImageUrl(event.bannerImage)}" alt="${event.title}" style="width:100%; max-height:220px; object-fit:cover; border-radius:16px; margin-bottom:20px;" />` : ''}
            <span style="font-size:11px; font-weight:800; color:#4f46e5; text-transform:uppercase; letter-spacing:1px;">EVENT REGISTRATION</span>
            <h1 style="font-size:24px; font-weight:800; color:#0f172a; margin:8px 0 6px 0; line-height:1.3;">${event.title}</h1>
            <p style="font-size:14px; color:#64748b; margin:0; line-height:1.5;">${event.description || 'Fill out the form below to complete your registration.'}</p>
          </div>

          <!-- Dynamic Form -->
          <form id="public-reg-form">
            ${fieldsHTML}

            <div style="margin-top:28px; padding-top:12px; border-top:1px solid #f1f5f9;">
              <button type="submit" id="submit-reg-btn" class="btn btn-primary btn-full" style="width:100%; padding:14px 20px; border-radius:12px; font-size:16px; font-weight:800; background:linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); border:none; color:white; box-shadow:0 4px 16px rgba(79,70,229,0.4); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s;">
                <span>✅</span> Submit Registration
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Attach real-time input filtering listeners for numeric, phone, aadhaar, pincode, and PAN fields
    formSchema.forEach((field, idx) => {
      const fieldId = `dyn-field-${idx}`;
      const el = document.getElementById(fieldId);
      if (!el) return;

      const behavior = getFieldBehavior(field);
      if (['number', 'phone', 'aadhaar', 'pincode'].includes(behavior)) {
        el.addEventListener('input', () => {
          el.value = el.value.replace(/[^0-9]/g, '');
          if (behavior === 'phone' && el.value.length > 10) {
            el.value = el.value.slice(0, 10);
          } else if (behavior === 'aadhaar' && el.value.length > 12) {
            el.value = el.value.slice(0, 12);
          } else if (behavior === 'pincode' && el.value.length > 6) {
            el.value = el.value.slice(0, 6);
          }
        });
      } else if (behavior === 'pan') {
        el.addEventListener('input', () => {
          el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (el.value.length > 10) el.value = el.value.slice(0, 10);
        });
      }
    });

    document.getElementById('public-reg-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-reg-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      const formData = {};

      for (let idx = 0; idx < formSchema.length; idx++) {
        const field = formSchema[idx];
        const fieldId = `dyn-field-${idx}`;
        let val = '';

        if (field.fieldType === 'radio' || (field.type || '').toLowerCase() === 'radio') {
          const checked = document.querySelector(`input[name="${field.name || fieldId}"]:checked`);
          val = checked ? checked.value : '';
        } else {
          const el = document.getElementById(fieldId);
          if (el) {
            val = el.type === 'checkbox' ? (el.checked ? 'true' : '') : el.value;
          }
        }

        const validationErr = validateFieldValue(field, val);
        if (validationErr) {
          showAlert(validationErr, 'danger');
          const focusEl = document.getElementById(fieldId);
          if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Registration';
          }
          return;
        }

        if (field.name) formData[field.name] = val;
        if (field.label) formData[field.label] = val;
      }

      try {
        const regRes = await apiFetch(`/api/registrations/${event._id}`, {
          method: 'POST',
          body: JSON.stringify({
            eventId: event._id,
            formData
          })
        });

        if (!regRes.ok) {
          const errData = await regRes.json().catch(() => ({}));
          const errorObj = new Error(errData.error || 'Failed to submit registration.');
          errorObj.code = errData.code;
          errorObj.status = regRes.status;
          throw errorObj;
        }

        const result = await regRes.json();
        const registrationObj = result.registration || {};
        const regId = registrationObj.registrationId || result.registrationId || 'REG-SUCCESS-1001';

        // Render Registration Success Page (Matching Reference Image)
        app.innerHTML = `
          <div style="min-height:100vh; background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); display:flex; align-items:center; justify-content:center; padding:40px 16px;">
            <div style="background:#ffffff; border-radius:24px; max-width:480px; width:100%; padding:44px 36px; border:none; text-align:center; box-shadow:0 25px 60px rgba(0,0,0,0.35);">
              
              <!-- Soft Green Circle Check Icon -->
              <div style="width:68px; height:68px; border-radius:50%; background:rgba(34,197,94,0.14); display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <!-- Main Heading -->
              <h2 style="font-size:24px; font-weight:800; color:#0f172a; margin-bottom:8px; letter-spacing:-0.3px;">Registration Confirmed!</h2>

              <!-- Subtitle text -->
              <p style="font-size:14px; color:#64748b; margin-bottom:28px; line-height:1.5;">
                Your response for <strong style="color:#0f172a;">${getEventAbbreviation(event)}</strong> has been successfully recorded.
              </p>

              <!-- Dashed Reference ID Container -->
              <div style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:16px; padding:22px 16px; margin-bottom:0;">
                <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">
                  REGISTRATION REFERENCE ID
                </div>
                <div style="font-size:24px; font-weight:800; color:#4f46e5; letter-spacing:1.5px; font-family: 'Inter', system-ui, sans-serif;">
                  ${regId}
                </div>
              </div>

              <!-- Button removed as requested -->
            </div>
          </div>
        `;
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Registration';
        }
        if (err.status === 409 || err.code === 'DUPLICATE_REGISTRATION') {
          showAlert(err.message || 'You have already registered for this event.', 'warning');
        } else {
          showAlert(err.message || 'Failed to submit registration.', 'danger');
        }
      }
    });

  } catch (err) {
    app.innerHTML = `
      <div style="min-height:100vh; background:#0f172a; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div class="alert alert-danger" style="max-width:400px; text-align:center;">${err.message}</div>
      </div>
    `;
  }
}

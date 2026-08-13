import { API_BASE } from '../utils/constants.js';
import { getFieldBehavior, getAttributesForBehavior, validateFieldValue } from '../utils/validation.js';

export async function renderAttendancePage(eventId, deskType = 'attendance') {
  return renderAttendanceLandingPage(eventId, deskType);
}

export async function renderAttendanceLandingPage(eventId, deskType = 'attendance') {
  const app = document.getElementById('app');

  let pageState = {
    eventTitle: 'Event Check-in Portal',
    bannerImage: '',
    formSchema: [],
    loading: true,
    error: null
  };

  try {
    const res = await fetch(`${API_BASE}/api/events/${eventId}`);
    if (res.ok) {
      const ev = await res.json();
      pageState.eventTitle = ev.title || 'Event Check-in Portal';
      pageState.bannerImage = ev.bannerImage || '';
      pageState.agendaPdf = ev.agendaPdf || '';
      pageState.formSchema = Array.isArray(ev.formSchema) ? ev.formSchema : [];
    }
  } catch (e) {}

  // Render Initial Verification Screen (Screen 1)
  function renderVerificationScreen(errorMsg = '') {
    const buttonText = 'Verify Registration';

    app.innerHTML = `
      <div class="attendance-landing-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 16px; background:#251b60;">
        <div class="attendance-card" style="background:#ffffff; border-radius:28px; padding:44px 36px; text-align:center; max-width:520px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:none;">
          
          <div style="width:60px; height:60px; background:#f3e8ff; color:#7c3aed; font-size:28px; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            ${deskType === 'food' ? '🍽️' : '📱'}
          </div>

          <h1 style="font-size:24px; font-weight:900; color:#0f172a; margin-bottom:8px; line-height:1.3; letter-spacing:-0.3px;">
            Welcome to ${pageState.eventTitle}
          </h1>
          <p style="font-size:13.5px; font-weight:500; color:#64748b; margin-bottom:28px;">
            Please enter your registered mobile number to verify your registration.
          </p>

          <form id="attendance-verify-form">
            <div style="text-align:left; margin-bottom:20px;">
              <label style="display:block; font-size:13px; font-weight:800; color:#334155; margin-bottom:8px;">
                Registered Mobile Number <span style="color:#ef4444;">*</span>
              </label>
              <div style="display:flex; align-items:center; border:2px solid #e2e8f0; border-radius:14px; overflow:hidden; background:#eff6ff;">
                <span style="padding:14px 16px; background:#eff6ff; color:#475569; font-weight:800; border-right:1px solid #cbd5e1;">+91</span>
                <input type="text" id="registered-mobile" placeholder="Enter 10-digit mobile number" maxlength="10" required style="flex:1; border:none; padding:14px 16px; font-size:15px; font-weight:700; outline:none; background:#eff6ff; color:#0f172a;" />
              </div>
            </div>

            <div id="attendance-alert">${errorMsg ? `<div class="alert alert-danger" style="margin-bottom:16px;">${errorMsg}</div>` : ''}</div>

            <button type="submit" id="verify-btn" style="width:100%; background:${deskType === 'food' ? '#ea580c' : '#4f46e5'}; color:#ffffff; border:none; padding:15px; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px ${deskType === 'food' ? 'rgba(234,88,12,0.35)' : 'rgba(79,70,229,0.35)'};">
              ${buttonText}
            </button>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('attendance-verify-form');
    const verifyBtn = document.getElementById('verify-btn');
    const alertBox = document.getElementById('attendance-alert');
    const mobileInput = document.getElementById('registered-mobile');

    mobileInput?.focus();

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mobile = mobileInput.value.trim();
      if (!mobile || mobile.length < 10) {
        alertBox.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ Please enter a valid 10-digit mobile number.</div>`;
        return;
      }

      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `Verifying...`;
      alertBox.innerHTML = '';

      try {
        const response = await fetch(`${API_BASE}/api/registrations/${eventId}/verify-mobile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNumber: mobile, deskType })
        });
        const data = await response.json();

        if (response.ok && data.success && data.participant) {
          if (deskType === 'food') {
            renderFoodSuccessScreen(data.participant);
          } else {
            renderAttendanceSuccessScreen(data.participant);
          }
        } else if (response.status === 400 && data.error && data.error.toLowerCase().includes('already redeemed')) {
          renderFoodAlreadyRedeemedScreen(data.error);
        } else if (response.status === 400 && data.requiresAttendance) {
          alertBox.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px; background:#fff7ed; border:1.5px solid #fed7aa; color:#c2410c; padding:12px 16px; border-radius:12px; font-weight:700; font-size:13.5px; text-align:left;">⚠️ Attendance Not Recorded! Please complete your entrance attendance process first before redeeming your food coupon.</div>`;
          verifyBtn.disabled = false;
          verifyBtn.innerHTML = buttonText;
        } else {
          // Case 2 — Mobile Number NOT Found
          if (deskType === 'food') {
            renderFoodUnavailableScreen();
          } else {
            alertBox.innerHTML = `
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:20px; padding:20px; margin-bottom:24px; text-align:center;">
                <div style="color:#dc2626; font-weight:800; font-size:14px; margin-bottom:16px; display:flex; align-items:center; justify-content:center; gap:6px;">
                  <span>❌</span> No registration found with this mobile number for this event.
                </div>
                
                <div style="background:#ffffff; border:1px solid #fee2e2; border-radius:16px; padding:18px 16px; text-align:center;">
                  <div style="font-size:13px; font-weight:800; color:#991b1b; margin-bottom:12px;">
                    Not registered for this event yet?
                  </div>
                  <button type="button" id="proceed-spot-btn" style="width:100%; background:#d97706; color:#ffffff; border:none; padding:13px; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                    ⚡ Proceed with Spot Registration
                  </button>
                </div>
              </div>
            `;
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = buttonText;

            document.getElementById('proceed-spot-btn')?.addEventListener('click', () => {
              renderSpotRegistrationForm(mobile);
            });
          }
        }
      } catch (err) {
        alertBox.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ Network error. Please try again.</div>`;
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = buttonText;
      }
    });
  }

  // Case 1 — Success Screen (Attendance & Kit)
  function renderAttendanceSuccessScreen(participant) {
    // Build the agenda download URL.
    // S3 URLs cannot be accessed directly (bucket is private → AccessDenied).
    // Proxy them through the backend /api/public/s3-agenda/<key> endpoint.
    let agendaUrl = '';
    if (pageState.agendaPdf) {
      const pdf = pageState.agendaPdf.trim();
      if (pdf.includes('.s3.') && pdf.includes('amazonaws.com')) {
        // Extract S3 key from URL: everything after amazonaws.com/
        const keyMatch = pdf.match(/amazonaws\.com\/(.+)$/);
        if (keyMatch) {
          agendaUrl = `${API_BASE}/api/public/s3-agenda/${keyMatch[1]}`;
        } else {
          agendaUrl = `${API_BASE}/api/public/s3-agenda/${pdf.split('/').slice(-2).join('/')}`;
        }
      } else if (pdf.startsWith('http://') || pdf.startsWith('https://')) {
        // Non-S3 public URL — use directly
        agendaUrl = pdf;
      } else {
        // Relative/local path — prepend backend base
        agendaUrl = `${API_BASE}${pdf.startsWith('/') ? pdf : '/' + pdf}`;
      }
    }


    app.innerHTML = `
      <div class="attendance-landing-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 16px; background:#251b60;">
        <div style="background:#ffffff; border-radius:28px; padding:44px 36px; text-align:center; max-width:520px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:none;">
          
          <div style="width:60px; height:60px; background:#f3e8ff; color:#7c3aed; font-size:28px; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            📱
          </div>

          <h1 style="font-size:26px; font-weight:900; color:#0f172a; margin-bottom:8px; letter-spacing:-0.4px;">
            Welcome ${participant.name || 'Participant'}!
          </h1>

          <div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:16px;">
            Registration ID: <span style="background:#e0e7ff; color:#4338ca; padding:4px 12px; border-radius:20px; font-weight:800; font-family: 'Inter', system-ui, sans-serif; font-size:13px;">${participant.registrationId || 'REG-XXXXX'}</span>
          </div>

          <h3 style="font-size:18px; font-weight:800; color:#10b981; margin-bottom:24px;">
            Attendance Confirmed Successfully!
          </h3>

          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:20px; padding:28px 22px; text-align:center; margin-bottom:0;">
            <div style="width:48px; height:48px; background:#ffffff; font-size:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 14px auto; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              🎉
            </div>

            <h2 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:6px; line-height:1.3;">
              Welcome to ${pageState.eventTitle}!
            </h2>

            <p style="font-size:13px; font-weight:700; color:#10b981; margin-bottom:20px;">
              Your Attendance has been confirmed successfully.
            </p>

            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:16px 18px; text-align:left;">
              <div style="display:flex; align-items:flex-start; gap:12px;">
                <span style="font-size:20px; line-height:1.2;">🎒</span>
                <div style="font-size:13px; color:#334155; font-weight:600; line-height:1.45;">
                  <strong style="color:#0f172a;">Registration Desk:</strong> Please proceed to the Registration Desk to collect your Event Kit.
                </div>
              </div>
            </div>
          </div>

          ${agendaUrl ? `
            <div style="margin-top:20px;">
              <a href="${agendaUrl}" target="_blank" download="Event_Agenda.pdf" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; background:#4f46e5; color:#ffffff; font-weight:800; font-size:14px; padding:14px 20px; border-radius:14px; text-decoration:none; box-shadow:0 4px 14px rgba(79,70,229,0.35); transition:all 0.2s;">
                📄 Download Event Agenda
              </a>
            </div>
          ` : ''}

        </div>
      </div>
    `;
  }

  // Case 1 — Success Screen (Food Coupon Verified)
  function renderFoodSuccessScreen(participant) {
    const regId = participant.registrationId || 'REG-XXXXX';
    const pName = participant.name || participant.participantName || participant.fullName || (participant.participant && participant.participant.fullName) || 'Participant';

    app.innerHTML = `
      <div class="attendance-landing-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 16px; background:#251b60;">
        <div style="background:#ffffff; border-radius:28px; padding:44px 36px; text-align:center; max-width:520px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:none;">
          
          <div style="width:60px; height:60px; background:#fff7ed; color:#ea580c; font-size:28px; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            🍽️
          </div>

          <h1 style="font-size:26px; font-weight:900; color:#0f172a; margin-bottom:8px; letter-spacing:-0.4px; line-height:1.25;">
            Welcome ${pName}!
          </h1>

          <div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:24px;">
            Registration ID: <span style="background:#fff7ed; color:#ea580c; border:1px solid #fed7aa; padding:4px 12px; border-radius:20px; font-weight:800; font-family: 'Inter', system-ui, sans-serif; font-size:13px;">${regId}</span>
          </div>

          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:20px; padding:28px 24px; text-align:center; margin-bottom:0;">
            <h3 style="font-size:20px; font-weight:800; color:#ea580c; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px;">
              <span>🍽️</span> Enjoy Your Meal!
            </h3>

            <p style="font-size:13.5px; font-weight:600; color:#9a3412; margin:0; line-height:1.6;">
              Thank you for being a part of <strong>${pageState.eventTitle}</strong>. We hope you enjoy the food and have a wonderful experience at the event.
            </p>
          </div>

        </div>
      </div>
    `;
  }

  function renderFoodAlreadyRedeemedScreen(msg = 'Food coupon already redeemed.') {
    app.innerHTML = `
      <div class="attendance-landing-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 16px; background:#fff7ed;">
        <div style="background:#ffffff; border-radius:24px; padding:40px 32px; text-align:center; max-width:480px; width:100%; box-shadow:0 10px 30px rgba(0,0,0,0.06); border:1px solid #fed7aa;">
          <div style="width:68px; height:68px; background:#fef2f2; color:#ef4444; font-size:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            ⚠️
          </div>

          <h1 style="font-size:22px; font-weight:900; color:#ef4444; margin-bottom:12px;">Food coupon already redeemed.</h1>

          <p style="font-size:14px; color:#64748b; font-weight:600; margin-bottom:24px;">
            This food coupon has already been redeemed for ${pageState.eventTitle}.
          </p>

          <button id="back-verify-btn" class="btn btn-secondary btn-full" style="width:100%; padding:14px; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer;">
            Back to Verification
          </button>
        </div>
      </div>
    `;

    document.getElementById('back-verify-btn')?.addEventListener('click', () => {
      renderVerificationScreen();
    });
  }

  function renderFoodUnavailableScreen() {
    app.innerHTML = `
      <div class="attendance-landing-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 16px; background:#fff7ed;">
        <div style="background:#ffffff; border-radius:24px; padding:40px 32px; text-align:center; max-width:480px; width:100%; box-shadow:0 10px 30px rgba(0,0,0,0.06); border:1px solid #fed7aa;">
          <div style="width:68px; height:68px; background:#fef2f2; color:#ef4444; font-size:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            🚫
          </div>

          <h1 style="font-size:22px; font-weight:900; color:#ef4444; margin-bottom:12px;">Food Coupon Unavailable</h1>

          <p style="font-size:14px; color:#64748b; font-weight:600; margin-bottom:24px; line-height:1.5;">
            There is no registration with this mobile number for <strong>${pageState.eventTitle}</strong>, so food coupon is unavailable.
          </p>

          <button id="back-food-unavailable-btn" class="btn btn-secondary btn-full" style="width:100%; padding:14px; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer;">
            Try Different Mobile Number
          </button>
        </div>
      </div>
    `;

    document.getElementById('back-food-unavailable-btn')?.addEventListener('click', () => {
      renderVerificationScreen();
    });
  }

  // Spot Registration Form (Using existing Form Builder schema assigned to the event)
  function renderSpotRegistrationForm(initialMobile = '') {
    // Helper to flatten fields from sections or flat array
    const extractFlatFields = (schema) => {
      const flat = [];
      if (!Array.isArray(schema)) return flat;
      schema.forEach(item => {
        if (!item) return;
        if (item.isSection === true || Array.isArray(item.fields)) {
          if (Array.isArray(item.fields)) {
            item.fields.forEach(f => { if (f) flat.push(f); });
          }
        } else {
          flat.push(item);
        }
      });
      return flat;
    };

    const rawFlat = extractFlatFields(pageState.formSchema);

    const formSchema = rawFlat.length > 0
      ? rawFlat
      : [
          { name: 'participantName', label: 'Full Name', fieldType: 'short_text', type: 'text', required: true, placeholder: 'Enter your full name' },
          { name: 'participantEmail', label: 'Email Address', fieldType: 'email', type: 'email', required: true, placeholder: 'name@example.com' },
          { name: 'participantPhone', label: 'Phone Number', fieldType: 'phone', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number' }
        ];

    const fieldsHTML = formSchema.map((field, idx) => {
      const fieldLabel = field.label || field.name || `Field ${idx + 1}`;
      const fieldName = field.name || field.label || `field_${idx}`;
      const type = (field.fieldType || field.type || 'short_text').toLowerCase();
      const isReq = field.required === true;
      const reqMark = isReq ? '<span style="color:#ef4444;">*</span>' : '';
      const fieldId = `spot-field-${idx}`;

      if (type === 'long_text' || type === 'textarea' || type === 'paragraph') {
        return `
          <div class="form-group" style="margin-bottom:18px; text-align:left;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:6px; display:block;">${fieldLabel} ${reqMark}</label>
            <textarea id="${fieldId}" name="${fieldName}" class="form-control" rows="3" placeholder="${field.placeholder || ''}" ${isReq ? 'required' : ''} style="width:100%; border-radius:12px; border:1px solid #cbd5e1; padding:12px 14px; font-size:14px;"></textarea>
          </div>
        `;
      } else if (type === 'dropdown' || type === 'select') {
        const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `<option value="${opt}">${opt}</option>`).join('');
        return `
          <div class="form-group" style="margin-bottom:18px; text-align:left;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:6px; display:block;">${fieldLabel} ${reqMark}</label>
            <select id="${fieldId}" name="${fieldName}" class="form-control" ${isReq ? 'required' : ''} style="width:100%; border-radius:12px; border:1px solid #cbd5e1; padding:12px 14px; font-size:14px; background:#fff;">
              <option value="">-- Select ${fieldLabel} --</option>
              ${optionsHTML}
            </select>
          </div>
        `;
      } else {
        const behavior = getFieldBehavior(field);
        const attrStr = getAttributesForBehavior(behavior);

        let defaultVal = '';
        const isPhoneField = behavior === 'phone' || fieldLabel.toLowerCase().includes('phone') || fieldLabel.toLowerCase().includes('mobile');
        if (isPhoneField && initialMobile) {
          defaultVal = initialMobile;
        }

        return `
          <div class="form-group" style="margin-bottom:18px; text-align:left;">
            <label class="form-label" style="font-weight:700; color:#334155; font-size:13px; margin-bottom:6px; display:block;">${fieldLabel} ${reqMark}</label>
            <input ${attrStr} id="${fieldId}" name="${fieldName}" class="form-control" value="${defaultVal}" placeholder="${field.placeholder || ''}" ${isReq ? 'required' : ''} style="width:100%; border-radius:12px; border:1px solid #cbd5e1; padding:12px 14px; font-size:14px;" />
          </div>
        `;
      }
    }).join('');

    app.innerHTML = `
      <div style="min-height:100vh; background:#251b60; display:flex; align-items:center; justify-content:center; padding:32px 16px;">
        <div style="background:#ffffff; border-radius:24px; max-width:520px; width:100%; padding:36px 32px; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:none; text-align:center;">
          
          <button id="back-to-verify-btn" type="button" style="background:none; border:none; color:#64748b; font-size:13px; font-weight:700; cursor:pointer; margin-bottom:16px; display:inline-flex; align-items:center; gap:4px; padding:0;">
            ← Back to Verification
          </button>

          <div style="text-align:center; margin-bottom:24px;">
            <span style="display:inline-block; padding:4px 14px; background:#eef2ff; color:#4f46e5; font-size:12px; font-weight:800; border-radius:20px; margin-bottom:8px; border:1px solid #c7d2fe;">
              ⚡ SPOT REGISTRATION
            </span>
            <h1 style="font-size:22px; font-weight:900; color:#0f172a; margin:4px 0 6px 0;">${pageState.eventTitle}</h1>
            <p style="font-size:13px; color:#64748b; margin:0;">Complete spot registration to mark attendance</p>
          </div>

          <form id="spot-reg-form">
            ${fieldsHTML}

            <div id="spot-alert"></div>

            <button type="submit" id="submit-spot-btn" class="btn btn-primary btn-full" style="width:100%; padding:14px; border-radius:14px; font-size:15px; font-weight:800; margin-top:12px; background:#4f46e5; border:none; color:white; box-shadow:0 4px 14px rgba(79,70,229,0.3); cursor:pointer;">
              Submit Spot Registration
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('back-to-verify-btn')?.addEventListener('click', () => {
      renderVerificationScreen();
    });

    formSchema.forEach((field, idx) => {
      const fieldId = `spot-field-${idx}`;
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

    document.getElementById('spot-reg-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-spot-btn');
      const spotAlert = document.getElementById('spot-alert');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }
      spotAlert.innerHTML = '';

      const formData = {};
      for (let idx = 0; idx < formSchema.length; idx++) {
        const field = formSchema[idx];
        const fieldId = `spot-field-${idx}`;
        const el = document.getElementById(fieldId);
        const val = el ? (el.type === 'checkbox' ? (el.checked ? 'true' : '') : el.value) : '';

        const validationErr = validateFieldValue(field, val);
        if (validationErr) {
          spotAlert.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ ${validationErr}</div>`;
          if (el && typeof el.focus === 'function') el.focus();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Spot Registration';
          }
          return;
        }

        const fieldName = field.name || field.label || `field_${idx}`;
        const fieldLabel = field.label || field.name || `Field ${idx + 1}`;
        formData[fieldName] = val;
        formData[fieldLabel] = val;
      }

      try {
        const response = await fetch(`${API_BASE}/api/registrations/spot/${eventId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          renderSpotSuccessScreen(data);
        } else {
          spotAlert.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ ${data.error || 'Spot registration failed.'}</div>`;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Spot Registration';
          }
        }
      } catch (err) {
        spotAlert.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px;">⚠️ Network error. Please try again.</div>`;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Spot Registration';
        }
      }
    });
  }

  // Spot Registration Success Screen
  function renderSpotSuccessScreen(data) {
    const pName = data.participantName || 'Participant';
    const regId = data.registrationId || 'REG-XXXXX';

    app.innerHTML = `
      <div class="attendance-landing-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 16px; background:#251b60;">
        <div style="background:#ffffff; border-radius:28px; padding:44px 36px; text-align:center; max-width:520px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:none;">
          
          <div style="width:60px; height:60px; background:#f3e8ff; color:#7c3aed; font-size:28px; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            📱
          </div>

          <h1 style="font-size:26px; font-weight:900; color:#0f172a; margin-bottom:8px; letter-spacing:-0.4px;">
            Welcome ${pName}!
          </h1>

          <div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:16px;">
            Registration ID: <span style="background:#e0e7ff; color:#4338ca; padding:4px 12px; border-radius:20px; font-weight:800; font-family: 'Inter', system-ui, sans-serif; font-size:13px;">${regId}</span>
          </div>

          <h3 style="font-size:18px; font-weight:800; color:#10b981; margin-bottom:24px;">
            Spot Registration Confirmed Successfully!
          </h3>

          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:20px; padding:28px 22px; text-align:center; margin-bottom:0;">
            <div style="width:48px; height:48px; background:#ffffff; font-size:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 14px auto; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              🎉
            </div>

            <h2 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:6px; line-height:1.3;">
              Welcome to ${pageState.eventTitle}!
            </h2>

            <p style="font-size:13px; font-weight:700; color:#10b981; margin-bottom:20px;">
              Your Registration has been confirmed successfully.
            </p>

            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:16px 18px; text-align:left;">
              <div style="display:flex; align-items:flex-start; gap:12px;">
                <span style="font-size:20px; line-height:1.2;">🎒</span>
                <div style="font-size:13px; color:#334155; font-weight:600; line-height:1.45;">
                  <strong style="color:#0f172a;">Registration Desk:</strong> Please proceed to the Registration Desk to collect your Event Kit.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // Start with Verification Screen
  renderVerificationScreen();
}

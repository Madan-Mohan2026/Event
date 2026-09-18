import { apiFetch } from '../../services/api.js';
import { getPublicBaseUrl, buildQrUrl } from '../../utils/qrHelpers.js';
import { resolveImageUrl, getEventAbbreviation, formatEventDate } from '../../utils/eventHelpers.js';
import { showAlert } from '../../utils/helpers.js';
import { getFieldBehavior, getAttributesForBehavior, validateFieldValue } from '../../utils/validation.js';
import { getRegistrationStatus } from '../../utils/eventStatus.js';

export async function renderPublicRegistrationPage(eventId, step = '') {
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

    const regStatus = getRegistrationStatus(event);
    if (!regStatus.isAllowed) {
      const isNotOpenYet = regStatus.code === 'not_open';
      app.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 20px;">
          <div style="max-width: 500px; width: 100%; background: #ffffff; border-radius: 20px; padding: 40px 32px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="width:68px; height:68px; background:${isNotOpenYet ? '#fffbeb' : '#fef2f2'}; border:1px solid ${isNotOpenYet ? '#fde68a' : '#fca5a5'}; border-radius:20px; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:20px;">
              ${isNotOpenYet ? '⏳' : '🚫'}
            </div>
            <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">
              ${isNotOpenYet ? 'Registration Not Yet Open' : 'Registration Closed'}
            </h2>
            <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
              ${isNotOpenYet 
                ? `Registration for <strong>"${event.title}"</strong> is scheduled to open on <strong>${regStatus.formattedStart || 'the configured start time'}</strong>. Please check back then!`
                : `Registration for <strong>"${event.title}"</strong> has been closed.`}
            </p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin-bottom:24px; text-align:left; font-size:13px; color:#475569;">
              <div style="font-weight:800; color:#0f172a; margin-bottom:6px; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">Event Registration Window:</div>
              <div>📅 <strong>Start:</strong> ${regStatus.formattedStart || 'TBA'}</div>
              <div>📅 <strong>End:</strong> ${regStatus.formattedEnd || 'TBA'}</div>
            </div>
            <button onclick="window.location.reload()" style="background:#7e22ce; color:#ffffff; border:none; padding:12px 24px; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 14px rgba(126,34,206,0.3); transition:background 0.2s;">
              🔄 Refresh Status
            </button>
          </div>
        </div>
      `;
      return;
    }

    const formSchema = Array.isArray(event.formSchema) ? event.formSchema : [];

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

    const allFlatFields = extractFlatFields(formSchema);
    const hasSections = formSchema.some(item => item && (item.isSection === true || Array.isArray(item.fields)));

    let fieldIdxCounter = 0;

    const renderFieldHTML = (field, fieldId) => {
      const type = (field.fieldType || field.type || 'short_text').toLowerCase();
      const behavior = getFieldBehavior(field);
      const isReq = field.required === true;
      const reqMark = isReq ? '<span class="req-star">*</span>' : '';
      const helpTextHTML = field.helpText ? `<p class="public-reg-help-text">${field.helpText}</p>` : '';
      const placeholderText = field.placeholder || `Enter your ${field.label.toLowerCase()}`;

      const isFullWidth = ['long_text', 'textarea', 'paragraph', 'radio', 'checkbox', 'checkboxes', 'file', 'image'].includes(type) || (Array.isArray(field.options) && field.options.length > 2);
      const fieldWrapperClass = `form-group ${isFullWidth ? 'public-reg-field-full' : ''}`;

      if (type === 'long_text' || type === 'textarea' || type === 'paragraph') {
        return `
          <div class="${fieldWrapperClass}">
            <label class="public-reg-label" for="${fieldId}">${field.label} ${reqMark}</label>
            <textarea id="${fieldId}" name="${field.name || fieldId}" class="public-reg-textarea" rows="3" placeholder="${placeholderText}" ${isReq ? 'required' : ''}></textarea>
            ${helpTextHTML}
          </div>
        `;
      } else if (type === 'dropdown' || type === 'select') {
        const optionsHTML = (field.options || ['Option 1', 'Option 2']).map(opt => `<option value="${opt}">${opt}</option>`).join('');
        return `
          <div class="${fieldWrapperClass}">
            <label class="public-reg-label" for="${fieldId}">${field.label} ${reqMark}</label>
            <select id="${fieldId}" name="${field.name || fieldId}" class="public-reg-select" ${isReq ? 'required' : ''}>
              <option value="">-- Select ${field.label} --</option>
              ${optionsHTML}
            </select>
            ${helpTextHTML}
          </div>
        `;
      } else if (type === 'radio') {
        const optionsHTML = (field.options || ['Option 1', 'Option 2']).map((opt, oIdx) => `
          <label class="public-reg-radio-item">
            <input type="radio" name="${field.name || fieldId}" value="${opt}" ${isReq && oIdx === 0 ? 'required' : ''} />
            <span>${opt}</span>
          </label>
        `).join('');
        return `
          <div class="${fieldWrapperClass}">
            <label class="public-reg-label">${field.label} ${reqMark}</label>
            <div class="public-reg-radio-group">
              ${optionsHTML}
            </div>
            ${helpTextHTML}
          </div>
        `;
      } else if (type === 'checkbox' || type === 'checkboxes') {
        if (Array.isArray(field.options) && field.options.length > 1) {
          const optionsHTML = field.options.map(opt => `
            <label class="public-reg-checkbox-item">
              <input type="checkbox" name="${field.name || fieldId}" value="${opt}" />
              <span>${opt}</span>
            </label>
          `).join('');
          return `
            <div class="${fieldWrapperClass}">
              <label class="public-reg-label">${field.label} ${reqMark}</label>
              <div class="public-reg-checkbox-group">
                ${optionsHTML}
              </div>
              ${helpTextHTML}
            </div>
          `;
        }
        return `
          <div class="${fieldWrapperClass}">
            <label class="public-reg-checkbox-item" for="${fieldId}">
              <input type="checkbox" id="${fieldId}" name="${field.name || fieldId}" ${isReq ? 'required' : ''} />
              <span style="font-weight:600;">${field.label} ${reqMark}</span>
            </label>
            ${helpTextHTML}
          </div>
        `;
      } else if (type === 'file' || type === 'image') {
        return `
          <div class="${fieldWrapperClass}">
            <label class="public-reg-label" for="${fieldId}">${field.label} ${reqMark}</label>
            <input type="file" id="${fieldId}" name="${field.name || fieldId}" class="public-reg-input" ${isReq ? 'required' : ''} style="padding: 8px 12px;" />
            ${helpTextHTML}
          </div>
        `;
      } else {
        const attrStr = getAttributesForBehavior(behavior);
        return `
          <div class="${fieldWrapperClass}">
            <label class="public-reg-label" for="${fieldId}">${field.label} ${reqMark}</label>
            <input ${attrStr} id="${fieldId}" name="${field.name || fieldId}" class="public-reg-input" placeholder="${placeholderText}" ${isReq ? 'required' : ''} />
            ${helpTextHTML}
          </div>
        `;
      }
    };

    let metaItems = [];
    if (event.date) {
      const formattedDateStr = formatEventDate(event.date);
      const timeStr = event.time ? ` • ${event.time}` : '';
      metaItems.push(`
        <div class="public-reg-meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${formattedDateStr}${timeStr}</span>
        </div>
      `);
    }
    if (event.location || event.venue) {
      metaItems.push(`
        <div class="public-reg-meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>${event.location || event.venue}</span>
        </div>
      `);
    }
    const metaHTML = metaItems.join('');

    const getCountdownHTML = (targetDate) => {
      if (!targetDate) return '';
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return '';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      return `
        <div class="public-reg-countdown-box">
          <div class="countdown-unit"><span class="cnt-val" id="cnt-days">${days}</span><span class="cnt-lbl">DAYS</span></div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit"><span class="cnt-val" id="cnt-hours">${String(hours).padStart(2, '0')}</span><span class="cnt-lbl">HOURS</span></div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit"><span class="cnt-val" id="cnt-mins">${String(mins).padStart(2, '0')}</span><span class="cnt-lbl">MINUTES</span></div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit"><span class="cnt-val" id="cnt-secs">${String(secs).padStart(2, '0')}</span><span class="cnt-lbl">SECONDS</span></div>
        </div>
      `;
    };

    const countdownHTML = getCountdownHTML(event.date);

    const renderFormattedDescription = (text) => {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return '<p style="font-size:15px; color:#475569; line-height:1.7;">Join us for an exclusive event featuring keynotes, networking opportunities, and insights from industry leaders on scale-up journeys.</p>';
      }
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let html = '';
      let inList = false;

      lines.forEach(line => {
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          if (!inList) {
            html += '<ul style="list-style:none; padding:0; margin:16px 0; display:flex; flex-direction:column; gap:10px;">';
            inList = true;
          }
          const cleanText = line.replace(/^[-•*]\s*/, '');
          html += `
            <li style="font-size:15px; color:#334155; display:flex; align-items:flex-start; gap:10px; line-height:1.6;">
              <span style="color:#7e22ce; font-weight:800; line-height:1.2;">✓</span>
              <span>${cleanText}</span>
            </li>
          `;
        } else {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          html += `<p style="font-size:15px; color:#334155; line-height:1.7; margin:0 0 14px 0;">${line}</p>`;
        }
      });
      if (inList) html += '</ul>';
      return html;
    };

    const styleBlock = `
      <style>
        /* Global Reset & Page Scroll Fix */
        html, body, #app {
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh;
        }
        .public-reg-wrapper {
          min-height: 100vh;
          width: 100%;
          background-color: #f8fafc;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          overflow-y: auto !important;
          overflow-x: hidden;
        }

        /* Top Navigation Header (Used in Form mode) */
        .public-reg-nav {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .public-reg-nav-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .public-reg-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .public-reg-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #7e22ce;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(126, 34, 206, 0.25);
          cursor: pointer;
          border: none;
        }
        .public-reg-nav-btn:hover {
          background: #6b21a8;
          transform: translateY(-1px);
        }

        /* Hero Section */
        .public-reg-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
          color: #ffffff;
          padding: 56px 24px 64px 24px;
          position: relative;
          overflow: hidden;
        }
        .public-reg-hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .public-reg-hero-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .public-reg-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e9d5ff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          width: fit-content;
        }
        .public-reg-hero-title {
          font-size: 40px;
          font-weight: 900;
          color: #ffffff;
          margin: 0;
          line-height: 1.18;
          letter-spacing: -0.03em;
          word-break: break-word;
        }
        .public-reg-hero-summary {
          font-size: 15.5px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.6;
          max-width: 560px;
        }
        .public-reg-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 4px;
        }
        .public-reg-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .public-reg-hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 24px;
          margin-top: 12px;
        }
        .public-reg-hero-btn {
          background: #7e22ce;
          color: #ffffff;
          border: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(126, 34, 206, 0.4);
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .public-reg-hero-btn:hover {
          background: #6b21a8;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(126, 34, 206, 0.5);
        }

        /* Countdown Box */
        .public-reg-countdown-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 8px 18px;
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }
        .countdown-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cnt-val {
          font-size: 18px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1;
        }
        .cnt-lbl {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
          margin-top: 3px;
        }
        .countdown-sep {
          color: #a855f7;
          font-weight: 900;
          font-size: 16px;
          margin-top: -6px;
        }

        /* Banner Image Right */
        .public-reg-hero-right {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .public-reg-hero-banner-wrapper {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .public-reg-hero-banner-img {
          width: 100%;
          height: auto;
          max-height: 500px;
          object-fit: contain;
          display: block;
        }

        /* Overview Sections */
        .public-reg-overview-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }
        .public-reg-section-block-lg {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .public-reg-section-title-lg {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .public-reg-about-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
        }

        /* Venue Grid */
        .public-reg-venue-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: stretch;
        }
        .public-reg-venue-info-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .public-reg-venue-img-wrapper {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .public-reg-venue-img {
          width: 100%;
          height: auto;
          max-height: 260px;
          object-fit: contain;
          display: block;
        }
        .public-reg-venue-address-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        .public-reg-venue-address-text {
          font-size: 14px;
          color: #475569;
          margin: 0;
          line-height: 1.6;
        }
        .public-reg-venue-map-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
          min-height: 320px;
        }
        .public-reg-map-iframe {
          width: 100%;
          height: 100%;
          min-height: 320px;
          border: none;
        }

        /* Sticky Sub-Header Bar (Form View) */
        .public-reg-sticky-bar {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 24px;
        }
        .public-reg-sticky-container {
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .public-reg-sticky-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .public-reg-sticky-title {
          font-weight: 800;
          color: #0f172a;
        }
        .public-reg-sticky-date {
          color: #64748b;
          font-weight: 600;
        }
        .public-reg-steps {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .public-reg-step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
        }
        .public-reg-step.step-active {
          color: #7e22ce;
        }
        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }
        .step-active .step-num {
          background: #7e22ce;
          color: #ffffff;
        }
        .public-reg-step-divider {
          color: #cbd5e1;
          font-weight: 700;
        }

        /* Main Form Area */
        .public-reg-main {
          background-color: #f8fafc;
          padding: 40px 16px 80px 16px;
        }
        .public-reg-form-container {
          max-width: 1080px;
          margin: 0 auto;
        }
        .public-reg-form-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.05);
          padding: 40px;
        }

        .public-reg-section-block {
          margin-bottom: 32px;
        }
        .public-reg-section-block:last-child {
          margin-bottom: 0;
        }

        .public-reg-section-header {
          padding-bottom: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #f1f5f9;
        }
        .public-reg-section-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .public-reg-section-desc {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .public-reg-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px 24px;
        }
        .public-reg-field-full {
          grid-column: 1 / -1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }
        .public-reg-label {
          font-weight: 700;
          color: #1e293b;
          font-size: 13.5px;
          margin-bottom: 6px;
          display: block;
        }
        .req-star {
          color: #ef4444;
          margin-left: 3px;
          font-weight: 800;
        }

        .public-reg-input, .public-reg-select, .public-reg-textarea {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 11px 14px;
          font-size: 14px;
          color: #0f172a;
          background-color: #ffffff;
          box-sizing: border-box;
          transition: all 0.15s ease-in-out;
          outline: none;
          font-family: inherit;
        }
        .public-reg-input:focus, .public-reg-select:focus, .public-reg-textarea:focus {
          border-color: #7e22ce;
          box-shadow: 0 0 0 4px rgba(126, 34, 206, 0.12);
        }

        .public-reg-help-text {
          font-size: 12px;
          color: #64748b;
          margin: 5px 0 0 0;
          line-height: 1.4;
        }

        .public-reg-radio-group, .public-reg-checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .public-reg-radio-item, .public-reg-checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #334155;
          cursor: pointer;
          padding: 10px 14px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: background 0.15s, border-color 0.15s;
        }
        .public-reg-radio-item:hover, .public-reg-checkbox-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .public-reg-radio-item input, .public-reg-checkbox-item input {
          accent-color: #7e22ce;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .public-reg-submit-wrapper {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }
        .public-reg-submit-btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          background: linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%);
          border: none;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(126, 34, 206, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
        }
        .public-reg-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(126, 34, 206, 0.45);
        }
        .public-reg-submit-btn:active {
          transform: translateY(0);
        }
        .public-reg-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Success Card */
        .public-reg-confirm-card {
          background: #ffffff;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          padding: 48px 36px;
          border: 1px solid #e2e8f0;
          text-align: center;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.025);
          box-sizing: border-box;
          margin: 60px auto;
        }
        .public-reg-success-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
        }
        .public-reg-confirm-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .public-reg-confirm-subtitle {
          font-size: 14.5px;
          color: #64748b;
          margin: 0 0 28px 0;
          line-height: 1.5;
        }
        .public-reg-ref-box {
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 16px;
          padding: 22px 16px;
        }
        .public-reg-ref-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .public-reg-ref-id {
          font-size: 24px;
          font-weight: 800;
          color: #7e22ce;
          letter-spacing: 1.5px;
          font-family: inherit;
          word-break: break-all;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .public-reg-hero-container {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .public-reg-hero-title {
            font-size: 30px !important;
          }
          .public-reg-hero-right {
            order: -1;
          }
          .public-reg-venue-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .public-reg-hero {
            padding: 32px 16px 40px 16px !important;
          }
          .public-reg-form-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
          .public-reg-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .public-reg-steps {
            display: none !important;
          }
          .public-reg-about-card, .public-reg-venue-info-card {
            padding: 20px 16px !important;
          }
        }
      </style>
    `;

    // ── IF STEP === 'form' OR 'buyTickets': RENDER REGISTRATION FORM PAGE ────────
    if (step === 'form' || step === 'buyTickets') {
      let fieldsHTML = '';
      if (hasSections) {
        fieldsHTML = formSchema.map((sec, sIdx) => {
          if (!sec) return '';
          if (sec.isSection === true || Array.isArray(sec.fields)) {
            const secFields = Array.isArray(sec.fields) ? sec.fields : [];
            const secFieldsHTML = secFields.map(field => {
              const fId = `dyn-field-${fieldIdxCounter++}`;
              return renderFieldHTML(field, fId);
            }).join('');

            return `
              <div class="public-reg-section-block">
                <div class="public-reg-section-header">
                  <h3 class="public-reg-section-title">${sec.title || `Section ${sIdx + 1}`}</h3>
                  ${sec.description ? `<p class="public-reg-section-desc">${sec.description}</p>` : ''}
                </div>
                <div class="public-reg-grid">
                  ${secFieldsHTML || '<p style="font-size:13px; color:#94a3b8; font-style:italic;" class="public-reg-field-full">No fields in this section.</p>'}
                </div>
              </div>
            `;
          } else {
            const fId = `dyn-field-${fieldIdxCounter++}`;
            return renderFieldHTML(sec, fId);
          }
        }).join('');
        fieldsHTML = `<div class="public-reg-sections-container">${fieldsHTML}</div>`;
      } else {
        const renderedFields = formSchema.map(field => {
          const fId = `dyn-field-${fieldIdxCounter++}`;
          return renderFieldHTML(field, fId);
        }).join('');

        fieldsHTML = `
          <div class="public-reg-section-header">
            <h3 class="public-reg-section-title">Purchaser and Attendee Information</h3>
          </div>
          <div class="public-reg-grid">
            ${renderedFields}
          </div>
        `;
      }

      app.innerHTML = `
        ${styleBlock}
        <div class="public-reg-wrapper">
          
          <!-- Top Navigation Header for Form View -->
          <header class="public-reg-nav">
            <div class="public-reg-nav-container">
              <div class="public-reg-nav-actions">
                <a href="#register/${event._id}" class="public-reg-nav-btn" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; box-shadow:none;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  <span>BACK TO EVENT INFO</span>
                </a>
              </div>
            </div>
          </header>

          <!-- Sticky Sub-Header Bar -->
          <div class="public-reg-sticky-bar">
            <div class="public-reg-sticky-container">
              <div class="public-reg-sticky-info">
                <span class="public-reg-sticky-title">${event.title}</span>
                ${event.date ? `<span class="public-reg-sticky-date">• ${formatEventDate(event.date)}</span>` : ''}
              </div>
              
              <div class="public-reg-steps">
                <div class="public-reg-step step-active">
                  <span class="step-num">1</span>
                  <span class="step-label">Share Details</span>
                </div>
                <div class="public-reg-step-divider">›</div>
                <div class="public-reg-step">
                  <span class="step-num">2</span>
                  <span class="step-label">Complete Registration</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Form Container -->
          <main class="public-reg-main" id="registration-form-section">
            <div class="public-reg-form-container">
              <div class="public-reg-form-card">
                <form id="public-reg-form">
                  ${fieldsHTML}

                  <div class="public-reg-submit-wrapper">
                    <button type="submit" id="submit-reg-btn" class="public-reg-submit-btn">
                      <span>Complete Registration</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>

        </div>
      `;

      allFlatFields.forEach((field, idx) => {
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
          submitBtn.innerHTML = `<span>Submitting...</span>`;
        }

        const formData = {};

        for (let idx = 0; idx < allFlatFields.length; idx++) {
          const field = allFlatFields[idx];
          const fieldId = `dyn-field-${idx}`;
          let val = '';

          const type = (field.fieldType || field.type || 'short_text').toLowerCase();
          if (type === 'radio') {
            const checked = document.querySelector(`input[name="${field.name || fieldId}"]:checked`);
            val = checked ? checked.value : '';
          } else if (type === 'checkbox' || type === 'checkboxes') {
            if (Array.isArray(field.options) && field.options.length > 1) {
              const checkedOpts = Array.from(document.querySelectorAll(`input[name="${field.name || fieldId}"]:checked`)).map(c => c.value);
              val = checkedOpts.join(', ');
            } else {
              const el = document.getElementById(fieldId);
              val = el ? (el.checked ? 'true' : '') : '';
            }
          } else {
            const el = document.getElementById(fieldId);
            if (el) {
              val = el.value;
            }
          }

          const validationErr = validateFieldValue(field, val);
          if (validationErr) {
            showAlert(validationErr, 'danger');
            const focusEl = document.getElementById(fieldId);
            if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = `<span>Complete Registration</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
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

          // Render Registration Success Page
          app.innerHTML = `
            ${styleBlock}
            <div class="public-reg-wrapper" style="display:flex; align-items:center; justify-content:center; padding: 20px;">
              <div class="public-reg-confirm-card">
                
                <div class="public-reg-success-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h2 class="public-reg-confirm-title">Registration Confirmed!</h2>

                <p class="public-reg-confirm-subtitle">
                  Your response for <strong style="color:#0f172a;">${getEventAbbreviation(event)}</strong> has been successfully recorded.
                </p>

                <div class="public-reg-ref-box">
                  <div class="public-reg-ref-label">
                    REGISTRATION REFERENCE ID
                  </div>
                  <div class="public-reg-ref-id">
                    ${regId}
                  </div>
                </div>

              </div>
            </div>
          `;
        } catch (err) {
          showAlert(err.message || 'Error submitting registration', 'danger');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Complete Registration</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          }
        }
      });

    } else {
      // ── OVERVIEW PAGE (step === '') ────────
      const rawBanner = event.bannerUrl || event.bannerImage || '';
      const bannerSrc = rawBanner ? (resolveImageUrl(rawBanner) || rawBanner) : '';
      const venueLocationStr = event.location || event.venue || 'Ratan Tata Innovation Hub (RTIH) Amaravati';
      const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(venueLocationStr)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

      const summaryText = event.summary || (event.description && typeof event.description === 'string' ? event.description.split('\n')[0] : '');

      const heroRightHTML = bannerSrc ? `
        <div class="public-reg-hero-right">
          <div class="public-reg-hero-banner-wrapper">
            <img src="${bannerSrc}" alt="${event.title}" class="public-reg-hero-banner-img" />
          </div>
        </div>
      ` : '';

      const heroGridStyle = bannerSrc ? '' : 'grid-template-columns: 1fr; max-width: 800px;';

      const venueImgHTML = bannerSrc ? `
        <div class="public-reg-venue-img-wrapper">
          <img src="${bannerSrc}" alt="Venue Preview" class="public-reg-venue-img" />
        </div>
      ` : '';

      app.innerHTML = `
        ${styleBlock}
        <div class="public-reg-wrapper">

          <!-- Hero Section (NO Top Nav Bar) -->
          <section class="public-reg-hero">
            <div class="public-reg-hero-container" style="${heroGridStyle}">
              
              <div class="public-reg-hero-left">
                <div class="public-reg-hero-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
                  <span>${event.participantType || event.category || 'STARTUPS'}</span>
                </div>

                <h1 class="public-reg-hero-title">${event.title}</h1>

                <!-- Event Summary directly below the Title -->
                ${summaryText ? `<p class="public-reg-hero-summary">${summaryText}</p>` : ''}

                ${metaHTML ? `<div class="public-reg-hero-meta">${metaHTML}</div>` : ''}

                <div class="public-reg-hero-cta-row">
                  <a href="#register/${event._id}/form" class="public-reg-hero-btn">
                    <span>REGISTER NOW</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </a>
                  ${countdownHTML}
                </div>
              </div>

              ${heroRightHTML}

            </div>
          </section>

          <!-- Main Overview Content -->
          <main class="public-reg-overview-container">
            
            <!-- About the Event Section -->
            <section class="public-reg-section-block-lg">
              <h2 class="public-reg-section-title-lg">About the Event</h2>
              <div class="public-reg-about-card">
                ${renderFormattedDescription(event.description)}
              </div>
            </section>

            <!-- Venue Section -->
            <section class="public-reg-section-block-lg">
              <h2 class="public-reg-section-title-lg">Venue</h2>
              <div class="public-reg-venue-grid">
                
                <div class="public-reg-venue-info-card">
                  ${venueImgHTML}
                  <div>
                    <h3 class="public-reg-venue-address-title">${venueLocationStr}</h3>
                    <p class="public-reg-venue-address-text">
                      ${event.venueAddress || venueLocationStr}, Andhra Pradesh, India.
                    </p>
                  </div>
                </div>

                <div class="public-reg-venue-map-card">
                  <iframe 
                    class="public-reg-map-iframe"
                    src="${mapSrc}"
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade">
                  </iframe>
                </div>

              </div>
            </section>

          </main>

        </div>
      `;

      if (event.date) {
        const countdownInterval = setInterval(() => {
          const diff = new Date(event.date).getTime() - Date.now();
          if (diff <= 0) {
            clearInterval(countdownInterval);
            return;
          }
          const dEl = document.getElementById('cnt-days');
          const hEl = document.getElementById('cnt-hours');
          const mEl = document.getElementById('cnt-mins');
          const sEl = document.getElementById('cnt-secs');
          if (dEl && hEl && mEl && sEl) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / 1000 / 60) % 60);
            const secs = Math.floor((diff / 1000) % 60);
            dEl.textContent = days;
            hEl.textContent = String(hours).padStart(2, '0');
            mEl.textContent = String(mins).padStart(2, '0');
            sEl.textContent = String(secs).padStart(2, '0');
          } else {
            clearInterval(countdownInterval);
          }
        }, 1000);
      }
    }

  } catch (err) {
    app.innerHTML = `
      <div style="min-height:100vh; background:#f8fafc; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div class="alert alert-danger" style="max-width:400px; text-align:center; background:#fef2f2; border:1px solid #fca5a5; color:#991b1b; padding:16px; border-radius:12px; font-weight:600;">${err.message}</div>
      </div>
    `;
  }
}

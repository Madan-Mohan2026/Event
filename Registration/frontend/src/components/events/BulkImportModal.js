import * as XLSX from 'xlsx';
import { state, triggerRealtimeSync } from '../../app.js';
import { bulkImportRegistrations } from '../../services/registrationService.js';
import { apiFetch } from '../../services/api.js';
import { showAlert } from '../../utils/helpers.js';

/**
 * Safely converts any Excel/CSV value (numbers, exponential notation, strings) to a clean string
 */
function rawValueToString(rawVal) {
  if (rawVal === undefined || rawVal === null) return '';
  if (typeof rawVal === 'number') {
    if (Number.isInteger(rawVal)) {
      return String(BigInt(rawVal));
    }
    const str = String(rawVal);
    if (str.includes('e') || str.includes('E')) {
      return rawVal.toFixed(0);
    }
    return str.trim();
  }
  return String(rawVal).trim();
}

/**
 * Normalizes phone number strings to 10 digits
 */
function normalizePhone(phoneStr) {
  if (!phoneStr) return '';
  const cleanDigits = String(phoneStr).replace(/\D/g, '');
  if (cleanDigits.length >= 10) return cleanDigits.slice(-10);
  return cleanDigits;
}

/**
 * Helper to normalize header keys and extract participant fields for bulk import
 */
function extractParticipantFields(item) {
  if (!item || typeof item !== 'object') {
    return { name: '', rawPhone: '', email: '', org: '', desig: '' };
  }

  let name = '';
  let rawPhone = '';
  let email = '';
  let org = '';
  let desig = '';

  const NAME_KEYS = ['participantname', 'employeename', 'name', 'fullname', 'applicantname', 'membername', 'personname', 'employee', 'participant_name'];
  const PHONE_KEYS = ['mobile', 'mobilenumber', 'mobileno', 'contactno', 'contactnumber', 'phone', 'phonenumber', 'phoneno', 'contact', 'contactn', 'cell', 'cellphone', 'whatsapp', 'whatsappnumber', 'telephone', 'participantphone', 'participantmobile', 'phone_number'];
  const EMAIL_KEYS = ['email', 'participantemail', 'emailaddress', 'mail', 'emailid'];
  const ORG_KEYS = ['organization', 'company', 'org', 'companyname', 'institution', 'college', 'university'];
  const DESIG_KEYS = ['designation', 'role', 'title', 'jobtitle', 'position'];

  for (const [key, rawVal] of Object.entries(item)) {
    if (rawVal === undefined || rawVal === null) continue;
    const val = rawValueToString(rawVal);
    if (!val) continue;

    const normKey = String(key)
      .replace(/^\uFEFF/, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

    if (!name && NAME_KEYS.includes(normKey)) {
      name = val;
    } else if (!rawPhone && PHONE_KEYS.includes(normKey)) {
      rawPhone = val;
    } else if (!email && EMAIL_KEYS.includes(normKey)) {
      email = val;
    } else if (!org && ORG_KEYS.includes(normKey)) {
      org = val;
    } else if (!desig && DESIG_KEYS.includes(normKey)) {
      desig = val;
    }
  }

  // Fallbacks if not extracted via normalized loop
  if (!name) name = rawValueToString(item.name || item.participantName || item.fullName || item['Employee Name'] || item['Name']);
  if (!rawPhone) rawPhone = rawValueToString(item.phone || item.participantPhone || item.mobile || item.contact || item['Contact No'] || item['Mobile']);
  if (!email) email = rawValueToString(item.email || item.participantEmail || item['Email']);
  if (!org) org = rawValueToString(item.organization || item.company || item['Organization']);
  if (!desig) desig = rawValueToString(item.designation || item.role || item['Designation']);

  return { name, rawPhone, email, org, desig };
}

/**
 * Checks if a parsed row is completely empty
 */
function isRowEmpty(item) {
  if (!item || typeof item !== 'object') return true;
  const { name, rawPhone, email, org, desig } = extractParticipantFields(item);
  if (name || rawPhone || email || org || desig) return false;
  return Object.values(item).every(val => val === undefined || val === null || String(val).trim() === '');
}

/**
 * Parses CSV or TSV string into an array of objects
 */
function parseCsvOrTsv(text) {
  if (!text) return [];
  const cleanText = String(text).replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : '\t');

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const rowObj = {};
    headers.forEach((h, idx) => {
      if (h) {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      }
    });
    rows.push(rowObj);
  }

  return rows;
}

export function openBulkImportModal(defaultEventId = null, onSuccessCallback = null) {
  let modalHolder = document.getElementById('modal-holder');
  if (!modalHolder) {
    modalHolder = document.createElement('div');
    modalHolder.id = 'modal-holder';
    document.body.appendChild(modalHolder);
  }

  const events = state.events || [];
  let selectedEventId = defaultEventId || (events[0] ? events[0]._id : '');

  // Resolve target event object & title
  const targetEvt = events.find(ev => String(ev._id) === String(selectedEventId)) || state.currentEvent || null;
  const targetEventTitle = targetEvt ? (targetEvt.title || targetEvt.name || 'Event') : 'Selected Event';
  const isLockedEvent = Boolean(defaultEventId);

  let rawParsedRows = [];
  let analyzedParticipants = [];
  let validRecordsToImport = [];

  const eventOptionsHTML = events.map(ev => `
    <option value="${ev._id}" ${String(ev._id) === String(selectedEventId) ? 'selected' : ''}>
      ${ev.title} (${ev.participantType || ev.category || 'Event'})
    </option>
  `).join('');

  modalHolder.innerHTML = `
    <div class="modal-overlay" style="display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); z-index:99999; position:fixed; inset:0;">
      <div class="modal-container" style="max-width:760px; width:94%; text-align:left; padding:32px 28px; background:#ffffff; border-radius:24px; box-shadow:0 25px 60px rgba(0,0,0,0.25); max-height:92vh; overflow-y:auto;">
        
        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
          <div>
            <h3 style="font-size:20px; font-weight:800; color:#0f172a; margin:0;">
              📥 Bulk Import Participants (Excel / CSV)
            </h3>
            <p style="font-size:12.5px; color:#64748b; margin:4px 0 0 0;">
              Upload or paste participant data to register all valid participants into the selected event.
            </p>
          </div>
          <button id="close-bulk-import-modal-x" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; color:#64748b; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">✕</button>
        </div>

        <!-- Target Event Selection / Read-only Display -->
        <div style="margin-bottom:20px;">
          <label style="display:block; font-size:12.5px; font-weight:800; color:#334155; margin-bottom:6px;">
            Target Event <span style="color:#ef4444;">*</span>
          </label>
          ${isLockedEvent ? `
            <div style="background:#eef2ff; border:1.5px solid #c7d2fe; padding:12px 16px; border-radius:12px; display:flex; align-items:center; justify-content:space-between;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">📍</span>
                <div>
                  <div style="font-size:14.5px; font-weight:800; color:#1e1b4b;">${targetEventTitle}</div>
                  <div style="font-size:11.5px; color:#4338ca; font-weight:600;">Importing directly into this event</div>
                </div>
              </div>
              <span style="background:#4338ca; color:#ffffff; font-size:10.5px; font-weight:800; padding:4px 12px; border-radius:20px; letter-spacing:0.5px;">READ-ONLY</span>
            </div>
          ` : `
            <select id="bulk-import-event-select" style="width:100%; padding:11px 14px; border-radius:12px; border:1px solid #cbd5e1; font-size:14px; font-weight:700; color:#0f172a; background:#ffffff;">
              ${eventOptionsHTML || '<option value="">No events available</option>'}
            </select>
          `}
        </div>

        <!-- Mode Toggle Tabs: File Upload vs Copy-Paste -->
        <div style="display:flex; gap:10px; margin-bottom:18px;">
          <button type="button" id="tab-import-file" style="flex:1; padding:10px; border:none; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; background:#4f46e5; color:#ffffff; box-shadow:0 2px 8px rgba(79,70,229,0.3);">
            📁 Upload File (.csv, .xlsx)
          </button>
          <button type="button" id="tab-import-paste" style="flex:1; padding:10px; border:1px solid #e2e8f0; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; background:#f8fafc; color:#64748b;">
            📋 Copy-Paste Excel Cells
          </button>
        </div>

        <!-- File Upload Section -->
        <div id="section-import-file" style="margin-bottom:20px;">
          <div style="border:2px dashed #cbd5e1; border-radius:16px; padding:28px 20px; text-align:center; background:#f8fafc; cursor:pointer; transition:background 0.2s;" id="dropzone-area">
            <div style="font-size:36px; margin-bottom:8px;">📄</div>
            <p style="font-size:14px; font-weight:700; color:#334155; margin:0 0 4px 0;">Click or Drag & Drop Excel/CSV file here</p>
            <p style="font-size:12px; color:#64748b; margin:0 0 14px 0;">Supports .csv, .tsv, .txt, or text exports from Excel</p>
            <input type="file" id="bulk-import-file-input" accept=".csv, .tsv, .txt, .xlsx, .xls" style="display:none;" />
            <button type="button" id="btn-browse-file" style="background:#ffffff; border:1.5px solid #cbd5e1; color:#475569; padding:8px 18px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer;">
              Browse File...
            </button>
          </div>
        </div>

        <!-- Paste Data Section (Hidden by default) -->
        <div id="section-import-paste" style="display:none; margin-bottom:20px;">
          <label style="display:block; font-size:12.5px; font-weight:700; color:#334155; margin-bottom:6px;">
            Paste copied Excel cells (with header row Name, Phone/Contact, Email, Organization):
          </label>
          <textarea id="bulk-import-textarea" rows="6" placeholder="Full Name&#t;Mobile Number&#t;Email&#t;Organization&#10;Ramesh Kumar&#t;9876543210&#t;ramesh@example.com&#t;RTIH Startups&#10;Suresh Sharma&#t;9876543211&#t;suresh@example.com&#t;Innotribes" style="width:100%; border-radius:10px; border:1px solid #cbd5e1; padding:12px; font-size:13px; font-family:monospace; box-sizing:border-box; outline:none;"></textarea>
          <button type="button" id="btn-parse-pasted" style="margin-top:8px; background:#4f46e5; color:#ffffff; border:none; padding:9px 18px; border-radius:8px; font-size:12.5px; font-weight:800; cursor:pointer;">
            ⚡ Parse & Analyze Pasted Text
          </button>
        </div>

        <!-- Sample CSV download help link -->
        <div style="margin-bottom:16px; text-align:right;">
          <button type="button" id="btn-download-sample-csv" style="background:none; border:none; color:#4f46e5; font-size:12px; font-weight:700; cursor:pointer; text-decoration:underline;">
            📥 Download Sample Template CSV
          </button>
        </div>

        <!-- Validation Summary & Preview Section -->
        <div id="bulk-import-preview-container" style="display:none; margin-bottom:20px;">
          
          <!-- Summary Metric Cards -->
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-bottom:16px;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px 12px; border-radius:12px; text-align:center;">
              <div style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase;">Total Rows</div>
              <div id="stat-total-rows" style="font-size:20px; font-weight:900; color:#0f172a; margin-top:2px;">0</div>
            </div>
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:10px 12px; border-radius:12px; text-align:center;">
              <div style="font-size:10px; font-weight:800; color:#166534; text-transform:uppercase;">Valid to Import</div>
              <div id="stat-valid-rows" style="font-size:20px; font-weight:900; color:#15803d; margin-top:2px;">0</div>
            </div>
            <div style="background:#fff7ed; border:1px solid #fed7aa; padding:10px 12px; border-radius:12px; text-align:center;">
              <div style="font-size:10px; font-weight:800; color:#c2410c; text-transform:uppercase;">Duplicates Skipped</div>
              <div id="stat-duplicate-rows" style="font-size:20px; font-weight:900; color:#ea580c; margin-top:2px;">0</div>
            </div>
            <div style="background:#fef2f2; border:1px solid #fecaca; padding:10px 12px; border-radius:12px; text-align:center;">
              <div style="font-size:10px; font-weight:800; color:#991b1b; text-transform:uppercase;">Invalid Rows</div>
              <div id="stat-invalid-rows" style="font-size:20px; font-weight:900; color:#dc2626; margin-top:2px;">0</div>
            </div>
          </div>

          <!-- Preview Table -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div style="font-size:13px; font-weight:800; color:#0f172a;">
                Pre-Import Validation Preview
              </div>
              <span style="font-size:11px; font-weight:700; color:#64748b;">Showing first 100 rows</span>
            </div>

            <div style="max-height:220px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:10px; background:#ffffff;">
              <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
                <thead style="background:#f1f5f9; position:sticky; top:0; z-index:2;">
                  <tr>
                    <th style="padding:8px 12px; border-bottom:1px solid #cbd5e1; width:35px;">#</th>
                    <th style="padding:8px 12px; border-bottom:1px solid #cbd5e1; width:80px;">Status</th>
                    <th style="padding:8px 12px; border-bottom:1px solid #cbd5e1;">Participant Name</th>
                    <th style="padding:8px 12px; border-bottom:1px solid #cbd5e1;">Mobile</th>
                    <th style="padding:8px 12px; border-bottom:1px solid #cbd5e1;">Validation Note / Reason</th>
                  </tr>
                </thead>
                <tbody id="preview-table-body">
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Action Footer -->
        <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #e2e8f0; padding-top:18px;">
          <button type="button" id="btn-cancel-import" style="padding:10px 20px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; font-size:13.5px; font-weight:700; color:#64748b; cursor:pointer;">
            Cancel
          </button>
          <button type="button" id="btn-submit-import" disabled style="padding:10px 24px; border-radius:10px; border:none; background:#10b981; font-size:13.5px; font-weight:800; color:#ffffff; cursor:pointer; opacity:0.5; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
            🚀 Import 0 Participants
          </button>
        </div>

      </div>
    </div>
  `;

  const closeModal = () => { modalHolder.innerHTML = ''; };
  document.getElementById('close-bulk-import-modal-x')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-import')?.addEventListener('click', closeModal);

  // Tab switching
  const tabFile = document.getElementById('tab-import-file');
  const tabPaste = document.getElementById('tab-import-paste');
  const secFile = document.getElementById('section-import-file');
  const secPaste = document.getElementById('section-import-paste');

  tabFile?.addEventListener('click', () => {
    tabFile.style.background = '#4f46e5';
    tabFile.style.color = '#ffffff';
    tabFile.style.border = 'none';

    tabPaste.style.background = '#f8fafc';
    tabPaste.style.color = '#64748b';
    tabPaste.style.border = '1px solid #e2e8f0';

    secFile.style.display = 'block';
    secPaste.style.display = 'none';
  });

  tabPaste?.addEventListener('click', () => {
    tabPaste.style.background = '#4f46e5';
    tabPaste.style.color = '#ffffff';
    tabPaste.style.border = 'none';

    tabFile.style.background = '#f8fafc';
    tabFile.style.color = '#64748b';
    tabFile.style.border = '1px solid #e2e8f0';

    secPaste.style.display = 'block';
    secFile.style.display = 'none';
  });

  // Pre-import analysis against existing DB registrations for target event
  const analyzeParsedData = async (parsedRows) => {
    rawParsedRows = (parsedRows || []).filter(row => !isRowEmpty(row));
    const targetEvtId = isLockedEvent ? defaultEventId : (document.getElementById('bulk-import-event-select')?.value || selectedEventId);

    if (!targetEvtId) {
      showAlert('Please select a target event first.', 'warning');
      return;
    }

    const previewContainer = document.getElementById('bulk-import-preview-container');
    const submitBtn = document.getElementById('btn-submit-import');

    if (previewContainer) previewContainer.style.display = 'block';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ Checking duplicates against database...';
    }

    // 1. Fetch existing registrations for target event strictly
    let dbPhonesSet = new Set();
    let dbEmailsSet = new Set();

    try {
      let res = await apiFetch(`/api/admin/registrations?eventId=${targetEvtId}&limit=5000`);
      if (!res.ok) {
        res = await apiFetch(`/api/registrations/${targetEvtId}?limit=5000`);
      }
      if (res.ok) {
        const data = await res.json();
        const existing = data.registrations || (Array.isArray(data) ? data : []);
        existing.forEach(r => {
          if (r.participantPhoneNormalized) dbPhonesSet.add(r.participantPhoneNormalized);
          if (r.participantPhone) dbPhonesSet.add(normalizePhone(r.participantPhone));
          if (r.participantEmail) dbEmailsSet.add(String(r.participantEmail).toLowerCase().trim());
        });
      }
    } catch (e) {
      console.warn('Could not fetch existing event registrations for preview duplicate check:', e);
    }

    const filePhonesSet = new Set();
    const fileEmailsSet = new Set();

    analyzedParticipants = [];
    validRecordsToImport = [];

    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rawParsedRows.length; i++) {
      const item = rawParsedRows[i];
      const { name, rawPhone, email, org, desig } = extractParticipantFields(item);

      if (!name && !rawPhone && !email && !org && !desig) {
        continue;
      }

      if (!rawPhone && !email) {
        invalidCount++;
        analyzedParticipants.push({
          rowNum: i + 1,
          name: name || 'N/A',
          phone: rawPhone || 'N/A',
          email: email || 'N/A',
          status: 'invalid',
          reason: 'Phone or email is required'
        });
        continue;
      }

      const normPhone = normalizePhone(rawPhone);
      const normEmail = email ? email.toLowerCase() : '';

      const displayName = name || 'N/A';
      const displayPhone = rawPhone || 'N/A';

      // Check duplicates against DB
      if (normPhone && dbPhonesSet.has(normPhone)) {
        duplicateCount++;
        analyzedParticipants.push({
          rowNum: i + 1,
          name: displayName,
          phone: displayPhone,
          email,
          status: 'duplicate',
          reason: 'Duplicate: participant already registered for this event (Mobile match)'
        });
        continue;
      }
      if (normEmail && dbEmailsSet.has(normEmail)) {
        duplicateCount++;
        analyzedParticipants.push({
          rowNum: i + 1,
          name: displayName,
          phone: displayPhone,
          email,
          status: 'duplicate',
          reason: 'Duplicate: participant already registered for this event (Email match)'
        });
        continue;
      }

      // Check duplicates within uploaded file
      if (normPhone && filePhonesSet.has(normPhone)) {
        duplicateCount++;
        analyzedParticipants.push({
          rowNum: i + 1,
          name: displayName,
          phone: displayPhone,
          email,
          status: 'duplicate',
          reason: 'Duplicate: same mobile number appears in uploaded file'
        });
        continue;
      }
      if (normEmail && fileEmailsSet.has(normEmail)) {
        duplicateCount++;
        analyzedParticipants.push({
          rowNum: i + 1,
          name: displayName,
          phone: displayPhone,
          email,
          status: 'duplicate',
          reason: 'Duplicate: same email address appears in uploaded file'
        });
        continue;
      }

      if (normPhone) filePhonesSet.add(normPhone);
      if (normEmail) fileEmailsSet.add(normEmail);

      validCount++;
      analyzedParticipants.push({
        rowNum: i + 1,
        name: displayName,
        phone: displayPhone,
        email,
        status: 'valid',
        reason: 'Valid participant'
      });
      validRecordsToImport.push({
        ...item,
        name: displayName !== 'N/A' ? displayName : (name || 'Participant'),
        phone: displayPhone !== 'N/A' ? displayPhone : rawPhone,
        email,
        organization: org,
        designation: desig
      });
    }

    // Update Metric Cards
    document.getElementById('stat-total-rows').textContent = rawParsedRows.length;
    document.getElementById('stat-valid-rows').textContent = validCount;
    document.getElementById('stat-duplicate-rows').textContent = duplicateCount;
    document.getElementById('stat-invalid-rows').textContent = invalidCount;

    // Render Preview Table
    const tbody = document.getElementById('preview-table-body');
    if (tbody) {
      tbody.innerHTML = analyzedParticipants.slice(0, 100).map(p => {
        let badgeHTML = '';
        if (p.status === 'valid') {
          badgeHTML = `<span style="background:#dcfce7; color:#15803d; font-weight:800; font-size:10px; padding:2px 8px; border-radius:10px;">Valid</span>`;
        } else if (p.status === 'duplicate') {
          badgeHTML = `<span style="background:#fff7ed; color:#c2410c; font-weight:800; font-size:10px; padding:2px 8px; border-radius:10px;">Duplicate</span>`;
        } else {
          badgeHTML = `<span style="background:#fef2f2; color:#b91c1c; font-weight:800; font-size:10px; padding:2px 8px; border-radius:10px;">Invalid</span>`;
        }

        return `
          <tr style="${p.status === 'duplicate' ? 'background:#fffcf5;' : (p.status === 'invalid' ? 'background:#fff5f5;' : '')}">
            <td style="padding:6px 12px; border-bottom:1px solid #f1f5f9; font-weight:700; color:#64748b;">${p.rowNum}</td>
            <td style="padding:6px 12px; border-bottom:1px solid #f1f5f9;">${badgeHTML}</td>
            <td style="padding:6px 12px; border-bottom:1px solid #f1f5f9; font-weight:700; color:#0f172a;">${p.name}</td>
            <td style="padding:6px 12px; border-bottom:1px solid #f1f5f9; font-family:monospace; color:#4f46e5;">${p.phone || '—'}</td>
            <td style="padding:6px 12px; border-bottom:1px solid #f1f5f9; font-size:11.5px; color:${p.status==='valid'?'#15803d':(p.status==='duplicate'?'#c2410c':'#b91c1c')}; font-weight:600;">${p.reason}</td>
          </tr>
        `;
      }).join('');
    }

    if (submitBtn) {
      if (validCount > 0) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerHTML = `🚀 Import ${validCount} Participants`;
      } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.innerHTML = `🚀 Import 0 Participants`;
      }
    }
  };

  // Handle Browse File / Drag & Drop / File Processing
  const fileInput = document.getElementById('bulk-import-file-input');
  const browseBtn = document.getElementById('btn-browse-file');
  const dropzone = document.getElementById('dropzone-area');

  const handleFileProcess = async (file) => {
    if (!file) return;

    const fileName = file.name || '';
    const ext = fileName.split('.').pop().toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target.result;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            showAlert('The uploaded Excel file contains no sheets.', 'warning');
            return;
          }
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const cleanRows = rows.filter(r => !isRowEmpty(r));
          if (cleanRows.length === 0) {
            showAlert('Could not parse any valid rows from selected Excel file.', 'warning');
          } else {
            showAlert(`Parsed ${cleanRows.length} participant rows from file "${file.name}"`, 'success');
            await analyzeParsedData(cleanRows);
          }
        } catch (err) {
          console.error('Error reading Excel file:', err);
          showAlert('Failed to read Excel file: ' + (err.message || 'Unknown error'), 'danger');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const text = evt.target.result;
          const parsed = parseCsvOrTsv(text);
          const cleanRows = parsed.filter(r => !isRowEmpty(r));
          if (cleanRows.length === 0) {
            showAlert('Could not parse any valid rows from selected file.', 'warning');
          } else {
            showAlert(`Parsed ${cleanRows.length} participant rows from file "${file.name}"`, 'success');
            await analyzeParsedData(cleanRows);
          }
        } catch (err) {
          console.error('Error reading file:', err);
          showAlert('Failed to read file: ' + (err.message || 'Unknown error'), 'danger');
        }
      };
      reader.readAsText(file);
    }
  };

  browseBtn?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    handleFileProcess(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.background = '#eef2ff';
  });
  dropzone?.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.background = '#f8fafc';
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.background = '#f8fafc';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  });

  // Handle Paste Data Button
  document.getElementById('btn-parse-pasted')?.addEventListener('click', async () => {
    const text = document.getElementById('bulk-import-textarea')?.value || '';
    if (!text.trim()) {
      showAlert('Please paste cell data into the text box.', 'warning');
      return;
    }
    const parsed = parseCsvOrTsv(text);
    const cleanRows = parsed.filter(r => !isRowEmpty(r));
    if (cleanRows.length === 0) {
      showAlert('Could not parse any valid rows from pasted text.', 'warning');
    } else {
      showAlert(`Parsed ${cleanRows.length} participant rows from pasted text!`, 'success');
      await analyzeParsedData(cleanRows);
    }
  });

  // Sample CSV Download
  document.getElementById('btn-download-sample-csv')?.addEventListener('click', () => {
    const sampleContent = "S.No,Employee Name,Contact No,Email,Organization\n1,Ramesh Kumar,9876543210,ramesh@example.com,RTIH Startups\n2,Suresh Sharma,9876543211,suresh@example.com,Innotribes";
    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Participant_Import_Sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Event select change handler if unlocked
  document.getElementById('bulk-import-event-select')?.addEventListener('change', (e) => {
    selectedEventId = e.target.value;
    if (rawParsedRows.length > 0) {
      analyzeParsedData(rawParsedRows);
    }
  });

  // Submit Handler
  document.getElementById('btn-submit-import')?.addEventListener('click', async function() {
    const targetEvtId = isLockedEvent ? defaultEventId : (document.getElementById('bulk-import-event-select')?.value || selectedEventId);

    if (!targetEvtId) {
      showAlert('Please select a target event for import.', 'warning');
      return;
    }

    if (validRecordsToImport.length === 0) {
      showAlert('No valid non-duplicate participants to import.', 'warning');
      return;
    }

    const btn = this;
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `⏳ Registering ${validRecordsToImport.length} participants into MongoDB...`;

    try {
      const result = await bulkImportRegistrations(targetEvtId, validRecordsToImport, 'APPROVED');
      
      // Render Import Result Summary Modal
      const container = modalHolder.querySelector('.modal-container');
      if (container) {
        container.innerHTML = `
          <div style="text-align:center; padding:24px 12px;">
            <div style="width:64px; height:64px; background:#dcfce7; color:#15803d; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:16px; box-shadow:0 4px 14px rgba(21,128,61,0.2);">✔</div>
            <h3 style="font-size:22px; font-weight:900; color:#0f172a; margin-bottom:6px;">Import Completed Successfully</h3>
            <p style="font-size:13.5px; color:#64748b; margin-bottom:28px;">Participants registered into <strong>${targetEventTitle}</strong>.</p>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-bottom:32px;">
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:16px 12px; border-radius:16px;">
                <div style="font-size:11px; font-weight:800; color:#166534; text-transform:uppercase;">Successfully Imported</div>
                <div style="font-size:26px; font-weight:900; color:#15803d; margin-top:4px;">${result.importedCount}</div>
              </div>
              <div style="background:#fff7ed; border:1px solid #fed7aa; padding:16px 12px; border-radius:16px;">
                <div style="font-size:11px; font-weight:800; color:#c2410c; text-transform:uppercase;">Duplicates Skipped</div>
                <div style="font-size:26px; font-weight:900; color:#ea580c; margin-top:4px;">${result.duplicateCount !== undefined ? result.duplicateCount : (result.skippedCount || 0)}</div>
              </div>
              <div style="background:#fef2f2; border:1px solid #fecaca; padding:16px 12px; border-radius:16px;">
                <div style="font-size:11px; font-weight:800; color:#991b1b; text-transform:uppercase;">Invalid Rows</div>
                <div style="font-size:26px; font-weight:900; color:#dc2626; margin-top:4px;">${result.invalidCount || 0}</div>
              </div>
            </div>

            <button id="btn-done-import-close" class="btn btn-primary" style="background:#4f46e5; color:#ffffff; border:none; padding:12px 36px; border-radius:12px; font-size:14.5px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(79,70,229,0.35);">
              Done & Refresh Registration List
            </button>
          </div>
        `;

        document.getElementById('btn-done-import-close')?.addEventListener('click', () => {
          closeModal();
          triggerRealtimeSync('STATS_UPDATED');
          if (typeof onSuccessCallback === 'function') {
            onSuccessCallback(result);
          }
        });
      }
    } catch (err) {
      showAlert('Bulk import failed: ' + (err.message || 'Unknown error'), 'danger');
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
}

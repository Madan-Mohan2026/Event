import * as XLSX from 'xlsx';
import { bulkImportParticipants } from '../../services/registrationService.js';
import { showAlert } from '../../utils/helpers.js';

/**
 * Opens the Bulk Import Modal for Super Admin to upload participants
 * via Excel (.xlsx, .xls, .csv) or Google Sheet link.
 * 
 * @param {Object} event - Event object
 * @param {Function} onSuccess - Callback invoked after successful import
 */
export function openBulkImportModal(event, onSuccess = null) {
  if (!event || !event._id) {
    showAlert('Please select a valid event to import participants.', 'danger');
    return;
  }

  // Remove existing modal if any
  document.getElementById('bulk-import-modal-overlay')?.remove();

  let activeTab = 'excel'; // 'excel' | 'sheets'
  let parsedData = []; // Array of object records
  let detectedHeaders = [];

  const overlay = document.createElement('div');
  overlay.id = 'bulk-import-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
  `;

  const renderModalContent = () => `
    <div style="background:#ffffff; border-radius:24px; max-width:680px; width:100%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #e2e8f0; overflow:hidden; display:flex; flex-direction:column; max-height:90vh;">
      
      <!-- Modal Header -->
      <div style="padding:22px 28px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">📥</span>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0;">Upload Registered Participants</h3>
          </div>
          <p style="font-size:13px; color:#64748b; margin:4px 0 0 0;">
            Event: <strong style="color:#4f46e5;">${event.title || 'Selected Event'}</strong>
          </p>
        </div>
        <button id="close-bulk-modal-btn" style="background:#f1f5f9; border:none; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; font-size:16px; font-weight:700; transition:all 0.15s;">
          ✕
        </button>
      </div>

      <!-- Scrollable Body -->
      <div style="padding:24px 28px; overflow-y:auto; flex:1;">
        
        <!-- Source Toggle Tabs -->
        <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:12px; margin-bottom:20px;">
          <button type="button" id="tab-excel-btn" style="flex:1; padding:9px; border-radius:9px; font-size:13px; font-weight:700; border:none; cursor:pointer; transition:all 0.15s; ${activeTab === 'excel' ? 'background:#ffffff; color:#4f46e5; box-shadow:0 2px 8px rgba(0,0,0,0.06);' : 'background:transparent; color:#64748b;'}">
            📊 Excel / CSV File (.xlsx, .csv)
          </button>
          <button type="button" id="tab-sheets-btn" style="flex:1; padding:9px; border-radius:9px; font-size:13px; font-weight:700; border:none; cursor:pointer; transition:all 0.15s; ${activeTab === 'sheets' ? 'background:#ffffff; color:#4f46e5; box-shadow:0 2px 8px rgba(0,0,0,0.06);' : 'background:transparent; color:#64748b;'}">
            🌐 Google Sheets Link
          </button>
        </div>

        <!-- Template Download Box -->
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:14px 18px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-size:13px; font-weight:700; color:#1e40af;">Need the standard column format?</div>
            <div style="font-size:12px; color:#3b82f6;">Download a ready-to-fill sample spreadsheet template.</div>
          </div>
          <button type="button" id="download-template-btn" style="background:#ffffff; color:#1d4ed8; border:1px solid #93c5fd; padding:7px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <span>📄</span> Download Sample Template
          </button>
        </div>

        <!-- Tab 1: Excel Drop Zone -->
        ${activeTab === 'excel' ? `
          <div id="drop-zone" style="border:2px dashed #cbd5e1; border-radius:16px; padding:32px 20px; text-align:center; background:#f8fafc; cursor:pointer; transition:all 0.2s; margin-bottom:20px;">
            <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" style="display:none;" />
            <div style="font-size:40px; margin-bottom:8px;">📁</div>
            <div style="font-size:14.5px; font-weight:700; color:#0f172a; margin-bottom:4px;">
              Click to browse or drag and drop your Excel / CSV file
            </div>
            <div style="font-size:12px; color:#64748b;">
              Supports .xlsx, .xls, and .csv files (up to 10,000 records per upload)
            </div>
          </div>
        ` : ''}

        <!-- Tab 2: Google Sheets URL Input -->
        ${activeTab === 'sheets' ? `
          <div style="margin-bottom:20px;">
            <label style="font-size:13px; font-weight:700; color:#334155; display:block; margin-bottom:6px;">
              Google Sheet Share Link (Anyone with the link can view):
            </label>
            <div style="display:flex; gap:8px;">
              <input type="url" id="sheet-url-input" class="form-control" placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit..." style="flex:1; border:1.5px solid #cbd5e1; border-radius:10px; padding:10px 14px; font-size:13.5px;" />
              <button type="button" id="load-sheet-btn" style="background:#4f46e5; color:#ffffff; border:none; padding:10px 18px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; white-space:nowrap;">
                <span>Fetch Rows</span>
              </button>
            </div>
            <p style="font-size:11.5px; color:#64748b; margin:6px 0 0 0;">
              💡 <strong>Tip:</strong> In Google Sheets, click <em>Share</em> → Set General access to <em>Anyone with the link (Viewer)</em>.
            </p>
          </div>
        ` : ''}

        <!-- Live Preview Container -->
        <div id="preview-container" style="${parsedData.length > 0 ? '' : 'display:none;'} margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="font-size:13px; font-weight:800; color:#0f172a;">
              Found <span style="color:#4f46e5; font-size:15px;" id="parsed-count">${parsedData.length}</span> participants to import:
            </div>
            <button type="button" id="clear-data-btn" style="background:transparent; border:none; color:#ef4444; font-size:12px; font-weight:700; cursor:pointer;">
              ✕ Clear
            </button>
          </div>

          <div style="max-height:200px; overflow:auto; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
              <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0; position:sticky; top:0; z-index:2;">
                <tr>
                  <th style="padding:8px 12px; color:#64748b; font-weight:700;">#</th>
                  ${detectedHeaders.slice(0, 5).map(h => `<th style="padding:8px 12px; color:#334155; font-weight:700;">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${parsedData.slice(0, 5).map((row, rIdx) => `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:8px 12px; color:#94a3b8; font-weight:600;">${rIdx + 1}</td>
                    ${detectedHeaders.slice(0, 5).map(h => `<td style="padding:8px 12px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${row[h] !== undefined ? row[h] : ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${parsedData.length > 5 ? `<div style="font-size:11.5px; color:#64748b; margin-top:6px; font-style:italic;">Showing first 5 of ${parsedData.length} rows preview.</div>` : ''}
        </div>

        <!-- Import Options -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin-bottom:10px;">
          <div style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">
            Import Options
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#334155; font-weight:600; cursor:pointer;">
              <input type="checkbox" id="opt-approve-cb" checked style="width:16px; height:16px; accent-color:#4f46e5; cursor:pointer;" />
              <span>Mark imported participants as <strong>APPROVED</strong> immediately</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#334155; font-weight:600; cursor:pointer;">
              <input type="checkbox" id="opt-email-cb" style="width:16px; height:16px; accent-color:#4f46e5; cursor:pointer;" />
              <span>Send registration confirmation email with QR code (if valid email present)</span>
            </label>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div style="padding:16px 28px; border-top:1px solid #f1f5f9; display:flex; align-items:center; justify-content:flex-end; gap:12px; background:#f8fafc;">
        <button type="button" id="cancel-bulk-modal-btn" style="padding:10px 20px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; font-size:13.5px; font-weight:700; cursor:pointer;">
          Cancel
        </button>
        <button type="button" id="submit-bulk-import-btn" ${parsedData.length === 0 ? 'disabled' : ''} style="padding:10px 24px; border-radius:10px; border:none; background:${parsedData.length > 0 ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#cbd5e1'}; color:#ffffff; font-size:13.5px; font-weight:800; cursor:${parsedData.length > 0 ? 'pointer' : 'not-allowed'}; display:inline-flex; align-items:center; gap:8px; box-shadow:${parsedData.length > 0 ? '0 4px 14px rgba(79,70,229,0.35)' : 'none'};">
          <span>🚀</span> Confirm & Import ${parsedData.length > 0 ? `(${parsedData.length})` : ''}
        </button>
      </div>

    </div>
  `;

  const bindEvents = () => {
    // Close / Cancel
    document.getElementById('close-bulk-modal-btn')?.addEventListener('click', () => overlay.remove());
    document.getElementById('cancel-bulk-modal-btn')?.addEventListener('click', () => overlay.remove());

    // Switch Tabs
    document.getElementById('tab-excel-btn')?.addEventListener('click', () => {
      activeTab = 'excel';
      render();
    });
    document.getElementById('tab-sheets-btn')?.addEventListener('click', () => {
      activeTab = 'sheets';
      render();
    });

    // Clear Data
    document.getElementById('clear-data-btn')?.addEventListener('click', () => {
      parsedData = [];
      detectedHeaders = [];
      render();
    });

    // Download Sample Template
    document.getElementById('download-template-btn')?.addEventListener('click', () => {
      const sampleRows = [
        {
          'Full Name': 'John Doe',
          'Email': 'john.doe@example.com',
          'Phone Number': '9876543210',
          'Category': 'Startup / Attendee',
          'Organization': 'Tech Innovators LLC'
        },
        {
          'Full Name': 'Jane Smith',
          'Email': 'jane.smith@example.com',
          'Phone Number': '9876543211',
          'Category': 'Investor',
          'Organization': 'Venture Partners'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Participants');
      XLSX.writeFile(wb, `${(event.title || 'Event').replace(/\s+/g, '_')}_Participant_Template.xlsx`);
    });

    // Excel Drag & Drop / File Input
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('excel-file-input');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#4f46e5';
        dropZone.style.background = '#eef2ff';
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.background = '#f8fafc';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.background = '#f8fafc';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      });
    }

    // Google Sheets Link Fetch
    document.getElementById('load-sheet-btn')?.addEventListener('click', async () => {
      const urlInput = document.getElementById('sheet-url-input');
      const rawUrl = urlInput ? urlInput.value.trim() : '';

      if (!rawUrl) {
        showAlert('Please paste a valid Google Sheets URL.', 'warning');
        return;
      }

      const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!idMatch || !idMatch[1]) {
        showAlert('Invalid Google Sheets URL format. It should look like: https://docs.google.com/spreadsheets/d/...', 'danger');
        return;
      }

      const sheetId = idMatch[1];
      const gidMatch = rawUrl.match(/[#&?]gid=([0-9]+)/);
      const gidParam = gidMatch && gidMatch[1] ? `&gid=${gidMatch[1]}` : '';

      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;

      const loadBtn = document.getElementById('load-sheet-btn');
      const prevText = loadBtn ? loadBtn.innerHTML : '';
      if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span>⏳ Fetching...</span>';
      }

      try {
        const response = await fetch(csvExportUrl);
        if (!response.ok) {
          throw new Error('Could not access Google Sheet. Please check that link sharing is set to "Anyone with the link can view".');
        }

        const csvText = await response.text();
        const workbook = XLSX.read(csvText, { type: 'string' });
        const firstSheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

        if (!rows || rows.length === 0) {
          throw new Error('Google Sheet appears to be empty or has no header rows.');
        }

        parsedData = rows;
        detectedHeaders = Object.keys(rows[0] || {});
        render();
        showAlert(`Successfully fetched ${parsedData.length} records from Google Sheet!`, 'success');
      } catch (err) {
        showAlert(err.message || 'Failed to fetch Google Sheet.', 'danger');
      } finally {
        if (loadBtn) {
          loadBtn.disabled = false;
          loadBtn.innerHTML = prevText;
        }
      }
    });

    // Confirm & Submit
    document.getElementById('submit-bulk-import-btn')?.addEventListener('click', async () => {
      if (!parsedData || parsedData.length === 0) {
        showAlert('Please upload an Excel file or fetch Google Sheets data first.', 'warning');
        return;
      }

      const isApprove = document.getElementById('opt-approve-cb')?.checked ?? true;
      const sendEmail = document.getElementById('opt-email-cb')?.checked ?? false;
      const submitBtn = document.getElementById('submit-bulk-import-btn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Importing...</span>';
      }

      try {
        const result = await bulkImportParticipants(
          event._id,
          parsedData,
          isApprove ? 'APPROVED' : 'PENDING',
          sendEmail
        );

        showAlert(result.message || `Successfully imported ${result.importedCount} participants!`, 'success');
        overlay.remove();

        if (typeof onSuccess === 'function') {
          onSuccess(result);
        }
      } catch (err) {
        showAlert(err.message || 'Failed to complete bulk import.', 'danger');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>🚀</span> Confirm & Import (${parsedData.length})`;
        }
      }
    });
  };

  const handleFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
          showAlert('The selected file contains no data rows.', 'warning');
          return;
        }

        parsedData = rows;
        detectedHeaders = Object.keys(rows[0] || {});
        render();
        showAlert(`Loaded ${parsedData.length} records from ${file.name}!`, 'success');
      } catch (err) {
        showAlert('Error reading spreadsheet file: ' + err.message, 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const render = () => {
    overlay.innerHTML = renderModalContent();
    bindEvents();
  };

  render();
  document.body.appendChild(overlay);
}

// QR Generator & Download Component
import { downloadQRImage } from '../utils/helpers.js';

export function renderQrModalHTML(title, dataUrl, targetUrl, filename = 'event-qr.png') {
  return `
    <div class="modal-overlay" id="qr-preview-modal" style="display:flex;">
      <div class="modal-dialog" style="max-width:440px;text-align:center;">
        <div class="modal-header" style="justify-content:center;">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" onclick="document.getElementById('qr-preview-modal').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:24px;">
          <div style="background:#ffffff;padding:16px;border-radius:16px;display:inline-block;box-shadow:0 8px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;margin-bottom:16px;">
            <img src="${dataUrl}" alt="QR Code" style="width:240px;height:240px;display:block;" />
          </div>
          <div style="font-size:12px;color:#64748b;word-break:break-all;margin-bottom:16px;">
            ${targetUrl}
          </div>
          <button id="download-qr-action-btn" class="btn btn-primary btn-full" style="padding:12px;font-weight:700;">
            📥 Download PNG QR Code
          </button>
        </div>
      </div>
    </div>
  `;
}

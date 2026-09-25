export function renderEventAdminMediaForm(isEdit, eventObj) {
  const safeEvent = eventObj || {};
  const contactNumber = isEdit ? (safeEvent.contactNumber || '+91 9876543210') : '+91 9876543210';
  const supportEmail = isEdit ? (safeEvent.supportEmail || 'support@rtih.com') : 'support@rtih.com';

  const existingBanner = isEdit ? (safeEvent.bannerImage || safeEvent.bannerImageUrl || safeEvent.imagePath || '') : '';
  const hasBanner = !!existingBanner;

  return `
    <div class="modal-form-section-card">
      <div class="section-card-header">
        👤 ADMINISTRATION & MEDIA
      </div>

      <div class="form-grid-2col">
        <div class="form-group-custom">
          <label class="form-label-custom">Contact Number</label>
          <input type="text" id="ev-contact" class="form-control-custom" value="${contactNumber}" placeholder="+91 9876543210" />
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Support Email</label>
          <input type="email" id="ev-email" class="form-control-custom" value="${supportEmail}" placeholder="support@rtih.com" />
        </div>
      </div>

      <div class="form-grid-2col margin-top-12">
        <div class="form-group-custom">
          <label class="form-label-custom">Event Banner Image <span style="font-weight:400; font-size:11px; color:#64748b;">(Max 10MB • JPG, PNG, WEBP, GIF)</span></label>
          <div class="file-input-wrapper">
            <input type="file" id="ev-banner-file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" />
            <button type="button" id="btn-trigger-banner-file" class="file-btn">Choose File</button>
            <span class="file-name-text" id="banner-file-name">${hasBanner ? 'Current banner loaded' : 'No file chosen'}</span>
          </div>

          <!-- Live Banner Image Preview Box -->
          <div id="banner-preview-container" style="margin-top: 12px; display: ${hasBanner ? 'block' : 'none'}; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 12px; position: relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:12px; font-weight:700; color:#334155; display:flex; align-items:center; gap:6px;">
                🖼️ Banner Image Preview
              </span>
              <button type="button" id="banner-remove-btn" class="btn" style="background:#fee2e2; color:#ef4444; border:1px solid #fca5a5; border-radius:8px; padding:4px 10px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
                🗑️ Remove Banner
              </button>
            </div>
            <div style="position:relative; width:100%; max-height:180px; overflow:hidden; border-radius:8px; background:#e2e8f0; display:flex; align-items:center; justify-content:center;">
              <img id="banner-preview-img" src="${existingBanner || ''}" alt="Event Banner Preview" style="width:100%; max-height:180px; object-fit:cover; display:${hasBanner ? 'block' : 'none'};" />
            </div>
            <div id="banner-preview-info" style="font-size:11px; color:#64748b; margin-top:6px; font-weight:600;">
              ${hasBanner ? 'Current event banner image' : ''}
            </div>
          </div>
        </div>

        <div class="form-group-custom">
          <label class="form-label-custom">Agenda PDF</label>
          <div class="file-input-wrapper">
            <input type="file" id="ev-agenda-file" accept="application/pdf" style="display:none;" />
            <button type="button" id="btn-trigger-agenda-file" class="file-btn">Choose File</button>
            <span class="file-name-text" id="agenda-file-name">No file chosen</span>
          </div>
        </div>
      </div>

      <div class="form-grid-2col margin-top-12">
        <div class="form-group-custom">
          <label class="form-label-custom" for="ev-food-requires-attendance">Food Coupon Attendance Requirement</label>
          <select id="ev-food-requires-attendance" class="form-control-custom">
            <option value="true" ${safeEvent.foodRequiresAttendance === false || safeEvent.foodRequiresAttendance === 'false' ? '' : 'selected'}>Attendance Required</option>
            <option value="false" ${safeEvent.foodRequiresAttendance === false || safeEvent.foodRequiresAttendance === 'false' ? 'selected' : ''}>Attendance Not Required</option>
          </select>
          <span style="font-size:11px; color:#64748b; margin-top:4px; display:block;">
            Default: Attendance Required. If set to Not Required, approved participants can redeem food coupons without check-in.
          </span>
        </div>
      </div>
    </div>
  `;
}


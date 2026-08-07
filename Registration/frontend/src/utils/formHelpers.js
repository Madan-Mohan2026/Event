export const SUPPORTED_FIELD_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'dropdown', label: 'Dropdown Menu' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'file', label: 'File Upload' },
  { value: 'image', label: 'Image Upload' },
  { value: 'url', label: 'URL / Website' },
  { value: 'address', label: 'Address' },
  { value: 'state', label: 'State' },
  { value: 'district', label: 'District' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'pincode', label: 'Pincode' },
  { value: 'aadhaar', label: 'Aadhaar Number' },
  { value: 'pan', label: 'PAN Number' },
  { value: 'company', label: 'Company Name' },
  { value: 'organization', label: 'Organization' },
  { value: 'designation', label: 'Designation' },
  { value: 'college', label: 'College / Institute' },
  { value: 'department', label: 'Department' },
  { value: 'year_of_study', label: 'Year of Study' },
  { value: 'gender', label: 'Gender' },
  { value: 'age', label: 'Age' },
  { value: 'experience', label: 'Experience (Years)' },
  { value: 'linkedin', label: 'LinkedIn URL' },
  { value: 'portfolio', label: 'Portfolio URL' }
];

export function getFieldTypeLabel(typeValue) {
  const found = SUPPORTED_FIELD_TYPES.find(t => t.value === typeValue || t.value === normalizeFieldType(typeValue));
  return found ? found.label : (typeValue || 'Short Text');
}

export function normalizeFieldType(typeStr) {
  if (!typeStr) return 'short_text';
  const str = String(typeStr).toLowerCase();
  if (str === 'text') return 'short_text';
  if (str === 'textarea') return 'long_text';
  if (str === 'mobile') return 'phone';
  return str;
}

export function formatCreatedDate(dateStr) {
  if (!dateStr) return 'Jul 30, 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Jul 30, 2026';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Jul 30, 2026';
  }
}

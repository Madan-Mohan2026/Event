// Validation Helpers

export function cleanMobile(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

export function isValidPhone(phone) {
  const digits = cleanMobile(phone);
  return digits.length >= 10 && digits.length <= 13;
}

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/**
 * Resolve the expected functional behavior of a form field based on its fieldType and label text.
 */
export function getFieldBehavior(field) {
  if (!field) return 'short_text';
  const rawType = String(field.fieldType || field.type || 'short_text').toLowerCase();
  const label = String(field.label || '').toLowerCase();

  if (rawType === 'number' || rawType === 'age' || rawType === 'experience' || rawType === 'year_of_study') {
    if (label.includes('aadhar') || label.includes('aadhaar')) return 'aadhaar';
    if (label.includes('phone') || label.includes('mobile')) return 'phone';
    if (label.includes('pincode') || label.includes('zip')) return 'pincode';
    return 'number';
  }

  if (rawType === 'phone' || rawType === 'mobile' || label.includes('phone') || label.includes('mobile')) {
    return 'phone';
  }

  if (rawType === 'aadhaar' || label.includes('aadhar') || label.includes('aadhaar')) {
    return 'aadhaar';
  }

  if (rawType === 'pincode' || label.includes('pincode') || label.includes('zip code')) {
    return 'pincode';
  }

  if (rawType === 'pan' || label.includes('pan number') || label.includes('pan card')) {
    return 'pan';
  }

  if (rawType === 'email' || label.includes('email')) {
    return 'email';
  }

  if (rawType === 'url' || rawType === 'website' || rawType === 'linkedin' || rawType === 'portfolio' || label.includes('url') || label.includes('website')) {
    return 'url';
  }

  if (label.includes('number') || label.includes('capacity') || label.includes('amount') || label.includes('count')) {
    return 'number';
  }

  if (rawType === 'date') return 'date';
  if (rawType === 'time') return 'time';
  if (rawType === 'datetime' || rawType === 'date_time') return 'datetime';

  return rawType;
}

/**
 * Return HTML attributes string for `<input>` based on field behavior.
 */
export function getAttributesForBehavior(behavior) {
  switch (behavior) {
    case 'number':
      return 'type="number" inputmode="numeric" pattern="[0-9]*"';
    case 'phone':
      return 'type="tel" inputmode="numeric" pattern="[0-9]{10}" maxlength="10"';
    case 'aadhaar':
      return 'type="text" inputmode="numeric" pattern="[0-9]{12}" maxlength="12"';
    case 'pincode':
      return 'type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6"';
    case 'pan':
      return 'type="text" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" maxlength="10" style="text-transform:uppercase;"';
    case 'email':
      return 'type="email"';
    case 'url':
      return 'type="url"';
    case 'date':
      return 'type="date"';
    case 'time':
      return 'type="time"';
    case 'datetime':
      return 'type="datetime-local"';
    default:
      return 'type="text"';
  }
}

/**
 * Validate field value according to its behavior. Returns error message string if invalid, or null if valid.
 */
export function validateFieldValue(field, val) {
  const behavior = getFieldBehavior(field);
  const label = field.label || 'This field';
  const strVal = String(val || '').trim();

  if (field.required && !strVal) {
    return `Please fill out required field: "${label}".`;
  }

  if (!strVal) return null;

  if (behavior === 'number') {
    if (!/^\d+$/.test(strVal)) {
      return `Please enter a valid numeric value (digits only) for "${label}".`;
    }
  } else if (behavior === 'phone') {
    if (!/^\d{10}$/.test(strVal)) {
      return `Please enter a valid 10-digit mobile number for "${label}".`;
    }
  } else if (behavior === 'aadhaar') {
    if (!/^\d{12}$/.test(strVal)) {
      return `Please enter a valid 12-digit Aadhaar number for "${label}".`;
    }
  } else if (behavior === 'pincode') {
    if (!/^\d{6}$/.test(strVal)) {
      return `Please enter a valid 6-digit Pincode for "${label}".`;
    }
  } else if (behavior === 'pan') {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(strVal.toUpperCase())) {
      return `Please enter a valid PAN card number format (e.g. ABCDE1234F) for "${label}".`;
    }
  } else if (behavior === 'email') {
    if (!isValidEmail(strVal)) {
      return `Please enter a valid email address for "${label}".`;
    }
  } else if (behavior === 'url') {
    try {
      new URL(strVal.startsWith('http') ? strVal : `https://${strVal}`);
    } catch (e) {
      return `Please enter a valid web URL for "${label}".`;
    }
  }

  return null;
}

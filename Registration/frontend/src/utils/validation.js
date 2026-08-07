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

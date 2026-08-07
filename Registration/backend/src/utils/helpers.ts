export function cleanMobileNumber(input?: string): string {
  if (!input) return '';
  return String(input).replace(/\D/g, '').slice(-10);
}

export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

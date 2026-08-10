/**
 * Reusable utility function to normalize phone numbers for strict duplicate detection per event.
 * Standardizes various formats:
 * - "+91 9876543210" -> "9876543210"
 * - "+919876543210"  -> "9876543210"
 * - "9876543210"     -> "9876543210"
 * - "91-9876543210"  -> "9876543210"
 * - "09876543210"    -> "9876543210"
 * - "(987) 654-3210" -> "9876543210"
 */
export function normalizePhoneNumber(rawPhone: any): string {
  if (rawPhone === undefined || rawPhone === null) return '';
  const str = String(rawPhone).trim();
  if (!str) return '';

  // Remove all non-digit characters
  const cleanDigits = str.replace(/\D/g, '');
  if (!cleanDigits) return '';

  // Extract last 10 digits for standard national subscriber number
  if (cleanDigits.length >= 10) {
    return cleanDigits.slice(-10);
  }

  return cleanDigits;
}

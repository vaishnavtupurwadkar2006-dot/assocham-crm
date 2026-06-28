/**
 * Normalizes phone numbers by:
 * - Trimming whitespace
 * - Removing internal spaces, hyphens, and parentheses
 * - Preserving a leading + if present
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (!trimmed) return ''
  const hasPlus = trimmed.startsWith('+')
  const cleaned = trimmed.replace(/[^0-9]/g, '')
  return hasPlus ? '+' + cleaned : cleaned
}

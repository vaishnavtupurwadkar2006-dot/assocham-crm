export const APPROVED_SECTORS = [
  'Agriculture',
  'Banking & Finance',
  'Biotechnology',
  'Consulting',
  'Education',
  'Energy',
  'Engineering',
  'Food & Beverage',
  'Government',
  'Handicrafts',
  'Healthcare',
  'Hospitality & Tourism',
  'Information Technology',
  'Legal',
  'Logistics & Supply Chain',
  'Manufacturing',
  'Media & Communications',
  'NGO / Non-Profit',
  'Pharmaceuticals',
  'Real Estate',
  'Renewable Energy',
  'Sustainability',
  'Other',
] as const;

export type ApprovedSector = typeof APPROVED_SECTORS[number];

const _approvedLower = new Map(APPROVED_SECTORS.map(s => [s.toLowerCase(), s]));

/**
 * Returns the canonical sector name if the value exactly matches (case-insensitive)
 * an approved sector. Otherwise returns the value unchanged.
 * No fuzzy mapping — the frontend enforces the dropdown, and Gemini is guided
 * by the approved list in the prompt.
 */
export function standardizeSector(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return _approvedLower.get(trimmed.toLowerCase()) ?? trimmed;
}

/**
 * Display helpers for department chips in the admin complaints panel.
 *
 * The `departments` table has no short-code column, so the tag is derived from
 * the department name. Known reference departments get their conventional
 * hospital abbreviation; anything added later falls back to initials.
 */
const DEPARTMENT_SHORT_NAMES: Record<string, string> = {
  'general medicine': 'GM',
  pediatrics: 'PEDS',
  'obstetrics & gynecology': 'OBG',
  'obstetrics and gynecology': 'OBG',
  orthopedics: 'ORTHO',
  'general surgery': 'GS',
  ophthalmology: 'OPHTH',
  ent: 'ENT',
  dermatology: 'DERM',
  psychiatry: 'PSYCH',
  radiology: 'RAD',
  pathology: 'PATH',
  anesthesiology: 'ANES',
  'emergency medicine': 'EM',
  'dental surgery': 'DENT',
  physiotherapy: 'PT',
};

const STOP_WORDS = new Set(['and', 'of', 'the']);

const TAG_TONES = [
  'bg-primary-50 text-primary-700 ring-primary-200',
  'bg-secondary-50 text-secondary-700 ring-secondary-200',
  'bg-success-50 text-success-700 ring-success-100',
  'bg-warning-50 text-warning-700 ring-warning-100',
  'bg-danger-50 text-danger-700 ring-danger-100',
  'bg-gray-100 text-gray-700 ring-gray-200',
] as const;

export function getDepartmentShortName(name?: string | null): string {
  const trimmed = name?.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'DEPT';

  const mapped = DEPARTMENT_SHORT_NAMES[trimmed.toLowerCase()];
  if (mapped) return mapped;

  const words = trimmed
    .replace(/&/g, ' and ')
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word.toLowerCase()));

  if (words.length === 0) return 'DEPT';
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();

  return words
    .map((word) => word[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();
}

/** Stable soft-colour tone so the same department keeps the same chip colour. */
export function getDepartmentTagTone(name?: string | null): string {
  const value = name?.trim().toLowerCase() || 'department';
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return TAG_TONES[hash % TAG_TONES.length];
}

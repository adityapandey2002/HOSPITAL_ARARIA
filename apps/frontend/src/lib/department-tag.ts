const TAG_TONES = [
  'bg-primary-50 text-primary-700 ring-primary-200',
  'bg-secondary-50 text-secondary-700 ring-secondary-200',
  'bg-success-50 text-success-700 ring-success-100',
  'bg-warning-50 text-warning-700 ring-warning-100',
  'bg-danger-50 text-danger-700 ring-danger-100',
  'bg-gray-100 text-gray-700 ring-gray-200',
] as const;

/** Stable soft-colour tone so the same department keeps the same chip colour. */
export function getDepartmentTagTone(name?: string | null): string {
  const value = name?.trim().toLowerCase() || 'department';
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return TAG_TONES[hash % TAG_TONES.length];
}

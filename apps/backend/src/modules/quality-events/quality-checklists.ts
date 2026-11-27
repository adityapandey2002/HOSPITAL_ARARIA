/**
 * Department-specific and hospital-wide checklist templates for quality
 * certification drives (NQAS, KAYAKALP, MUSQAN).
 *
 * Pure module so both the backend event generator and unit tests can share
 * exact department matching and readiness analytics rules.
 */

export type QualityEventType = 'NQAS' | 'KAYAKALP' | 'MUSQAN' | string;

export type ReadinessLevel = 'ready' | 'on_track' | 'needs_attention' | 'support_required';

export const COMMON_EVENT_CHECKLISTS: Record<string, readonly string[]> = {
  NQAS: [
    'Quality team meeting register is properly filled or not',
    'Documented SOPs and clinical protocols available and up to date',
    'Staff training and competency records maintained',
  ],
  KAYAKALP: [
    'Cleanliness and daily housekeeping checklist maintained',
    'Biomedical waste segregation and colour-coded bins verified',
    'Hand hygiene compliance and availability of consumables checked',
  ],
  MUSQAN: [
    'Child-friendly signage and waiting area safety verified',
    'Essential paediatric drugs and equipment readiness checked',
    'Quality team meeting register is properly filled or not',
  ],
};

interface DepartmentTemplateRule {
  readonly key: string;
  readonly label: string;
  readonly patterns: readonly RegExp[];
  readonly exclude?: readonly RegExp[];
  readonly tasks: readonly string[];
}

/**
 * Department-specific NQAS readiness pointers matched against hospital
 * department names. Matches both exact unit names (Labor Room, MOT, OT, ICU)
 * and standard Bihar district hospital department names.
 */
const NQAS_DEPARTMENT_RULES: readonly DepartmentTemplateRule[] = [
  {
    key: 'labor_room',
    label: 'Labor Room',
    patterns: [/\blabou?r\s*room\b/i, /\bLR\b/, /obstetrics|gynecology|maternity/i],
    tasks: [
      'The case sheet of the last 60 days is properly audited or not',
      'The ANCOS checklist is filled or not',
      'An action plan is created or not',
    ],
  },
  {
    key: 'mot',
    label: 'MOT',
    patterns: [/\bMOT\b/i, /\bminor\s*o\.?t\.?\b/i, /minor\s*operation/i],
    tasks: ['The biomedical waste management register is filled or not'],
  },
  {
    key: 'ot',
    label: 'OT',
    patterns: [/\bO\.?T\.?\b/i, /operation\s*theat(re|er)/i, /general\s*surgery/i, /anesthesiology/i],
    exclude: [/\bMOT\b/i, /minor\s*o\.?t\.?/i, /minor\s*operation/i],
    tasks: [
      'Prescription record audit done or not',
      'Patient satisfaction analysis done or not and action taken on PSS',
      'Infection control audits done or not',
    ],
  },
  {
    key: 'icu',
    label: 'ICU / Emergency',
    patterns: [/\bICU\b/i, /\bSNCU\b/i, /\bNICU\b/i, /emergency/i, /critical\s*care/i],
    tasks: [
      'Crash cart and emergency drug expiry register verified',
      'Infection control and device bundle audits done or not',
      'Equipment calibration and preventive maintenance logs updated',
    ],
  },
];

const NQAS_DEFAULT_DEPARTMENT_TASKS: readonly string[] = [
  'Prescription record audit done or not',
  'Biomedical waste management register is filled or not',
  'Patient satisfaction analysis done or not and action taken on PSS',
];

const KAYAKALP_DEPARTMENT_EXTRA: readonly string[] = [
  'Toilet and washroom hygiene checklist updated',
  'Hospital premises and ward upkeep verified',
];

const MUSQAN_DEPARTMENT_EXTRA: readonly string[] = [
  'Growth monitoring and immunization cold chain records maintained',
  'Patient satisfaction feedback from parents reviewed',
];

function dedupeStrings(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/**
 * Returns default checklist pointers for a given event type and department name.
 * Combines hospital-wide common pointers with department-specific pointers.
 */
export function buildDefaultChecklistForDepartment(
  eventType: QualityEventType,
  departmentName: string,
  customCommonTasks?: readonly string[],
  customDepartmentTasks?: readonly string[]
): string[] {
  const normalizedType = eventType.trim().toUpperCase();
  const common =
    customCommonTasks !== undefined
      ? customCommonTasks
      : COMMON_EVENT_CHECKLISTS[normalizedType] ?? ['Complete department quality checklist'];

  let specific: readonly string[];
  if (customDepartmentTasks !== undefined) {
    specific = customDepartmentTasks;
  } else if (normalizedType === 'NQAS') {
    const matched = NQAS_DEPARTMENT_RULES.filter(
      (rule) =>
        rule.patterns.some((pattern) => pattern.test(departmentName)) &&
        !(rule.exclude?.some((pattern) => pattern.test(departmentName)) ?? false)
    );
    specific =
      matched.length > 0
        ? matched.flatMap((rule) => rule.tasks)
        : NQAS_DEFAULT_DEPARTMENT_TASKS;
  } else if (normalizedType === 'KAYAKALP') {
    specific = KAYAKALP_DEPARTMENT_EXTRA;
  } else if (normalizedType === 'MUSQAN') {
    specific = MUSQAN_DEPARTMENT_EXTRA;
  } else {
    specific = [];
  }

  return dedupeStrings([...specific, ...common]);
}

export interface DepartmentReadinessInput {
  total: number;
  completed: number;
  hasIncharge: boolean;
  daysRemaining: number | null;
  isOverdue: boolean;
}

export interface DepartmentReadinessAssessment {
  completionPercent: number;
  pending: number;
  readinessLevel: ReadinessLevel;
  supportReason: string | null;
}

/**
 * Evaluates a department's readiness for an active quality drive and explains
 * where the Hospital Manager (HM) needs to step in and provide support.
 */
export function assessDepartmentReadiness(
  input: DepartmentReadinessInput
): DepartmentReadinessAssessment {
  const pending = Math.max(0, input.total - input.completed);
  const completionPercent =
    input.total === 0 ? 0 : Math.round((input.completed / input.total) * 100);

  if (input.total > 0 && pending === 0) {
    return {
      completionPercent: 100,
      pending: 0,
      readinessLevel: 'ready',
      supportReason: null,
    };
  }

  if (!input.hasIncharge) {
    return {
      completionPercent,
      pending,
      readinessLevel: 'support_required',
      supportReason: 'No department in-charge assigned — assign one in Staff & Access',
    };
  }

  if (input.isOverdue && pending > 0) {
    return {
      completionPercent,
      pending,
      readinessLevel: 'support_required',
      supportReason: `Deadline passed with ${pending} pending item${pending === 1 ? '' : 's'}`,
    };
  }

  if (input.daysRemaining !== null && input.daysRemaining <= 3 && completionPercent < 80) {
    return {
      completionPercent,
      pending,
      readinessLevel: 'support_required',
      supportReason: `Only ${input.daysRemaining} day${input.daysRemaining === 1 ? '' : 's'} left (${completionPercent}% complete, ${pending} pending)`,
    };
  }

  if (completionPercent < 40) {
    return {
      completionPercent,
      pending,
      readinessLevel: 'support_required',
      supportReason:
        input.completed === 0
          ? `No items completed yet (${pending} pending)`
          : `Low progress (${completionPercent}% done, ${pending} pending)`,
    };
  }

  if (completionPercent < 75 || (input.daysRemaining !== null && input.daysRemaining <= 7)) {
    return {
      completionPercent,
      pending,
      readinessLevel: 'needs_attention',
      supportReason: `${pending} item${pending === 1 ? '' : 's'} still pending before assessment`,
    };
  }

  return {
    completionPercent,
    pending,
    readinessLevel: 'on_track',
    supportReason: null,
  };
}

export function computeDeadlineState(
  endDate: Date | string | null | undefined,
  now: Date = new Date()
): { daysRemaining: number | null; isOverdue: boolean } {
  if (!endDate) return { daysRemaining: null, isOverdue: false };
  const target = endDate instanceof Date ? endDate : new Date(endDate);
  if (Number.isNaN(target.getTime())) return { daysRemaining: null, isOverdue: false };

  // Compare end-of-day UTC/local generously so "today" is 0 days remaining, not overdue.
  const endOfDeadlineDay = new Date(target);
  endOfDeadlineDay.setHours(23, 59, 59, 999);
  const diffMs = endOfDeadlineDay.getTime() - now.getTime();
  if (diffMs < 0) {
    const overdueDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return { daysRemaining: -overdueDays, isOverdue: true };
  }
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return { daysRemaining, isOverdue: false };
}

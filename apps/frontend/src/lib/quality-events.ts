/**
 * Pure frontend domain logic for hospital Quality Events (NQAS / KAYAKALP / MUSQAN),
 * default per-department checklist previews, deadline formatting, and HM analytics filters.
 */

export type QualityEventType = 'NQAS' | 'KAYAKALP' | 'MUSQAN';
export type ReadinessLevel = 'ready' | 'on_track' | 'needs_attention' | 'support_required';

export const QUALITY_EVENT_TYPES: readonly { value: QualityEventType; label: string; hint: string }[] = [
  { value: 'NQAS', label: 'NQAS', hint: 'National Quality Assurance Standards certification drive' },
  { value: 'KAYAKALP', label: 'KAYAKALP', hint: 'Cleanliness, hygiene & infection control assessment' },
  { value: 'MUSQAN', label: 'MUSQAN', hint: 'Child-friendly quality healthcare standards' },
];

export const COMMON_CHECKLIST_DEFAULTS: Record<QualityEventType, readonly string[]> = {
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

interface DeptChecklistRule {
  patterns: readonly RegExp[];
  exclude?: readonly RegExp[];
  tasks: readonly string[];
}

const NQAS_DEPT_RULES: readonly DeptChecklistRule[] = [
  {
    patterns: [/\blabou?r\s*room\b/i, /\bLR\b/, /obstetrics|gynecology|maternity/i],
    tasks: [
      'The case sheet of the last 60 days is properly audited or not',
      'The ANCOS checklist is filled or not',
      'An action plan is created or not',
    ],
  },
  {
    patterns: [/\bMOT\b/i, /\bminor\s*o\.?t\.?\b/i, /minor\s*operation/i],
    tasks: ['The biomedical waste management register is filled or not'],
  },
  {
    patterns: [/\bO\.?T\.?\b/i, /operation\s*theat(re|er)/i, /general\s*surgery/i, /anesthesiology/i],
    exclude: [/\bMOT\b/i, /minor\s*o\.?t\.?/i, /minor\s*operation/i],
    tasks: [
      'Prescription record audit done or not',
      'Patient satisfaction analysis done or not and action taken on PSS',
      'Infection control audits done or not',
    ],
  },
  {
    patterns: [/\bICU\b/i, /\bSNCU\b/i, /\bNICU\b/i, /emergency/i, /critical\s*care/i],
    tasks: [
      'Crash cart and emergency drug expiry register verified',
      'Infection control and device bundle audits done or not',
      'Equipment calibration and preventive maintenance logs updated',
    ],
  },
];

const NQAS_FALLBACK_DEPT_TASKS: readonly string[] = [
  'Prescription record audit done or not',
  'Biomedical waste management register is filled or not',
  'Patient satisfaction analysis done or not and action taken on PSS',
];

export function getDefaultDepartmentSpecificTasks(
  eventType: QualityEventType,
  departmentName: string
): string[] {
  if (eventType === 'NQAS') {
    const matched = NQAS_DEPT_RULES.filter(
      (rule) =>
        rule.patterns.some((p) => p.test(departmentName)) &&
        !(rule.exclude?.some((p) => p.test(departmentName)) ?? false)
    );
    if (matched.length > 0) {
      return [...new Set(matched.flatMap((r) => r.tasks))];
    }
    return [...NQAS_FALLBACK_DEPT_TASKS];
  }
  if (eventType === 'KAYAKALP') {
    return [
      'Toilet and washroom hygiene checklist updated',
      'Hospital premises and ward upkeep verified',
    ];
  }
  return [
    'Growth monitoring and immunization cold chain records maintained',
    'Patient satisfaction feedback from parents reviewed',
  ];
}

export interface QualityEventSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercent: number;
  totalDepartments: number;
}

export interface QualityEventItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  isArchived: boolean;
  daysRemaining?: number | null;
  isOverdue?: boolean;
  summary?: QualityEventSummary;
}

export interface DepartmentInchargeInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface DepartmentProgressReport {
  departmentId: string;
  departmentName: string;
  total: number;
  completed: number;
  pending: number;
  completionPercent: number;
  readinessLevel: ReadinessLevel;
  supportReason: string | null;
  incharges: DepartmentInchargeInfo[];
  pendingTasks: Array<{ id: string; title: string; remarks: string | null }>;
  completedTasks: Array<{
    id: string;
    title: string;
    completedAt: string | null;
    remarks: string | null;
  }>;
  lastActivityAt: string | null;
}

export interface CommonGapItem {
  title: string;
  pendingDepartmentsCount: number;
  totalDepartmentsCount: number;
  departmentNames: string[];
}

export interface QualityEventAnalytics {
  event: QualityEventItem;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionPercent: number;
    totalDepartments: number;
    readyDepartments: number;
    onTrackDepartments: number;
    needsAttentionDepartments: number;
    supportRequiredDepartments: number;
    unassignedDepartments: number;
  };
  departments: DepartmentProgressReport[];
  commonGaps: CommonGapItem[];
}

export interface QualityEventTaskItem {
  id: string;
  eventId: string;
  departmentId: string;
  departmentName?: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  completedBy?: string | null;
  completedByName?: string | null;
  completedAt?: string | null;
}

export const READINESS_META: Record<
  ReadinessLevel,
  { label: string; textClass: string; barClass: string; surfaceClass: string }
> = {
  support_required: {
    label: 'Support required',
    textClass: 'text-danger-700',
    barClass: 'bg-danger-600',
    surfaceClass: 'border-danger-200 bg-danger-50/60',
  },
  needs_attention: {
    label: 'Needs attention',
    textClass: 'text-warning-700',
    barClass: 'bg-warning-500',
    surfaceClass: 'border-warning-200 bg-warning-50/50',
  },
  on_track: {
    label: 'On track',
    textClass: 'text-primary-700',
    barClass: 'bg-primary-600',
    surfaceClass: 'border-primary-200 bg-primary-50/40',
  },
  ready: {
    label: 'Ready',
    textClass: 'text-success-700',
    barClass: 'bg-success-600',
    surfaceClass: 'border-success-200 bg-success-50/50',
  },
};

export function formatDeadlineCountdown(
  endDate?: string | null,
  daysRemaining?: number | null,
  isOverdue?: boolean
): { label: string; urgent: boolean } {
  if (!endDate) {
    return { label: 'No deadline set', urgent: false };
  }
  const parsed = new Date(endDate);
  const dateText = Number.isNaN(parsed.getTime())
    ? endDate
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isOverdue) {
    const overdueDays = Math.abs(daysRemaining ?? 1);
    return {
      label: `Overdue by ${overdueDays}d · ${dateText}`,
      urgent: true,
    };
  }
  if (daysRemaining === 0) {
    return { label: `Due today · ${dateText}`, urgent: true };
  }
  if (typeof daysRemaining === 'number' && daysRemaining > 0) {
    return {
      label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left · ${dateText}`,
      urgent: daysRemaining <= 5,
    };
  }
  return { label: `Deadline ${dateText}`, urgent: false };
}

export function addDaysIsoDate(days: number, baseDate: Date = new Date()): string {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + days);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseMultilinePointers(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim();
    if (cleaned.length < 3) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

export function filterDepartmentReports(
  reports: DepartmentProgressReport[],
  readinessFilter: 'all' | ReadinessLevel,
  searchQuery: string
): DepartmentProgressReport[] {
  const q = searchQuery.trim().toLowerCase();
  return reports.filter((dept) => {
    if (readinessFilter !== 'all' && dept.readinessLevel !== readinessFilter) {
      return false;
    }
    if (!q) return true;
    const matchesName = dept.departmentName.toLowerCase().includes(q);
    const matchesIncharge = dept.incharges.some((inc) => inc.name.toLowerCase().includes(q));
    const matchesPending = dept.pendingTasks.some((t) => t.title.toLowerCase().includes(q));
    return matchesName || matchesIncharge || matchesPending;
  });
}

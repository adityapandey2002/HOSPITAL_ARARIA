'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  PauseCircle,
  Phone,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import { UserRole, type Department } from '@dh-araria/shared/types';
import { cn } from '@dh-araria/shared/utils';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { api, handleApiResponse } from '@/lib/api';
import {
  COMMON_CHECKLIST_DEFAULTS,
  QUALITY_EVENT_TYPES,
  READINESS_META,
  addDaysIsoDate,
  filterDepartmentReports,
  formatDeadlineCountdown,
  getDefaultDepartmentSpecificTasks,
  parseMultilinePointers,
  type QualityEventAnalytics,
  type QualityEventItem,
  type QualityEventType,
  type ReadinessLevel,
} from '@/lib/quality-events';

function ProgressBar({ percent, barClass }: { percent: number; barClass: string }) {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
      <div
        className={cn('h-full rounded-full transition-all duration-200', barClass)}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function QualityEventsHub() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStaff = isAdmin || user?.role === UserRole.STAFF;

  const [events, setEvents] = useState<QualityEventItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<QualityEventAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Filters for HM department analytics table
  const [readinessFilter, setReadinessFilter] = useState<'all' | ReadinessLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  // Launch New Event form state (ADMIN only)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventType, setEventType] = useState<QualityEventType>('NQAS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => addDaysIsoDate(0));
  const [endDate, setEndDate] = useState(() => addDaysIsoDate(15));
  const [activateNow, setActivateNow] = useState(true);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [commonTasksText, setCommonTasksText] = useState(() =>
    COMMON_CHECKLIST_DEFAULTS.NQAS.join('\n')
  );
  const [customDeptTasks, setCustomDeptTasks] = useState<Record<string, string[]>>({});
  const [editingDeptId, setEditingDeptId] = useState<string>('');
  const [deptPointerInput, setDeptPointerInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [eventsRes, deptsRes] = await Promise.all([
        api.get<QualityEventItem[]>('/quality-events'),
        api.get<Department[]>('/departments', { limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      ]);
      const loadedEvents = handleApiResponse(eventsRes) ?? [];
      const loadedDepts = (handleApiResponse(deptsRes) ?? []).filter((d) => d.isActive !== false);

      setEvents(loadedEvents);
      setDepartments(loadedDepts);

      setSelectedDeptIds((prev) => (prev.length > 0 ? prev : loadedDepts.map((d) => d.id)));
      setEditingDeptId((prev) => prev || loadedDepts[0]?.id || '');

      if (isAdmin && loadedEvents.length > 0) {
        setSelectedEventId((prev) => {
          if (prev && loadedEvents.some((e) => e.id === prev)) return prev;
          const firstActive = loadedEvents.find((e) => e.isActive && !e.isArchived);
          return firstActive?.id ?? loadedEvents[0].id;
        });
      }
    } catch {
      setLoadError('Unable to load quality events. Please verify server connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) return;
    void loadBaseData();
  }, [isAuthenticated, isStaff, loadBaseData]);

  const loadAnalytics = useCallback(async (eventId: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get<QualityEventAnalytics>(`/quality-events/${eventId}/progress`);
      setAnalytics(handleApiResponse(res) ?? null);
    } catch {
      toast.error('Could not load readiness analytics for this event');
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin || !selectedEventId) {
      setAnalytics(null);
      return;
    }
    void loadAnalytics(selectedEventId);
  }, [isAdmin, selectedEventId, loadAnalytics]);

  const handleTypeChange = (nextType: QualityEventType) => {
    setEventType(nextType);
    setCommonTasksText(COMMON_CHECKLIST_DEFAULTS[nextType].join('\n'));
    setCustomDeptTasks({});
  };

  const toggleDeptSelection = (deptId: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const editingDept = useMemo(
    () => departments.find((d) => d.id === editingDeptId) ?? null,
    [departments, editingDeptId]
  );

  const currentEditingDeptTasks = useMemo(() => {
    if (!editingDept) return [];
    return (
      customDeptTasks[editingDept.id] ??
      getDefaultDepartmentSpecificTasks(eventType, editingDept.name)
    );
  }, [customDeptTasks, editingDept, eventType]);

  const addDepartmentPointer = () => {
    if (!editingDept) return;
    const additions = parseMultilinePointers(deptPointerInput);
    if (additions.length === 0) return;

    const existing = currentEditingDeptTasks;
    const seen = new Set(existing.map((item) => item.toLowerCase()));
    const merged = [...existing];
    for (const item of additions) {
      if (!seen.has(item.toLowerCase())) {
        merged.push(item);
        seen.add(item.toLowerCase());
      }
    }
    setCustomDeptTasks((prev) => ({ ...prev, [editingDept.id]: merged }));
    setDeptPointerInput('');
  };

  const removeDepartmentPointer = (index: number) => {
    if (!editingDept) return;
    const next = currentEditingDeptTasks.filter((_, i) => i !== index);
    setCustomDeptTasks((prev) => ({ ...prev, [editingDept.id]: next }));
  };

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!endDate) {
      toast.error('Please choose a deadline date');
      return;
    }
    if (selectedDeptIds.length === 0) {
      toast.error('Select at least one department');
      return;
    }

    setSaving(true);
    try {
      const commonTasks = parseMultilinePointers(commonTasksText);
      const res = await api.post<QualityEventItem>('/quality-events', {
        type: eventType,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        isActive: activateNow,
        departmentIds: selectedDeptIds,
        commonTasks: commonTasks.length > 0 ? commonTasks : undefined,
        departmentTasks:
          Object.keys(customDeptTasks).length > 0 ? customDeptTasks : undefined,
      });
      const created = handleApiResponse(res);
      toast.success('Quality event activated and assigned to departments');
      setTitle('');
      setDescription('');
      setCustomDeptTasks({});
      setShowCreateForm(false);
      await loadBaseData();
      if (created?.id) {
        setSelectedEventId(created.id);
      }
    } catch {
      toast.error('Could not launch quality event. Check your dates and try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEventState = async (
    ev: QualityEventItem,
    patch: { isActive?: boolean; isArchived?: boolean }
  ) => {
    setBusyEventId(ev.id);
    try {
      await api.patch(`/quality-events/${ev.id}`, patch);
      toast.success('Event status updated');
      await loadBaseData();
      if (selectedEventId === ev.id) {
        await loadAnalytics(ev.id);
      }
    } catch {
      toast.error('Failed to update event status');
    } finally {
      setBusyEventId(null);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!analytics) return [];
    return filterDepartmentReports(analytics.departments, readinessFilter, searchQuery);
  }, [analytics, readinessFilter, searchQuery]);

  const supportPriorityDepartments = useMemo(() => {
    if (!analytics) return [];
    return analytics.departments.filter(
      (dept) =>
        dept.readinessLevel === 'support_required' || dept.readinessLevel === 'needs_attention'
    );
  }, [analytics]);

  if (authLoading) {
    return (
      <div className="py-8">
        <div
          className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          <RefreshCw className="h-4 w-4 animate-spin text-primary-600" aria-hidden="true" />
          Checking your account…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Staff sign-in required</h1>
          <p className="mt-1.5 text-sm text-gray-600">
            Quality readiness checklists are available to the Hospital Manager (HM) and assigned
            Department In-charges.
          </p>
          <div className="mt-5">
            <Link
              href="/login?redirect=/admin/quality-events"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Department In-charge (STAFF) Mobile-First Dashboard
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              My Quality Checklists
            </h1>
            <p className="mt-0.5 text-sm text-gray-600">
              Active hospital certification drives assigned to your department. Tap any event to
              mark completed items.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadBaseData()}
            loading={loading}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm text-danger-800">
            <p>{loadError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void loadBaseData()}
            >
              Try again
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white p-4"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto mb-2.5 h-8 w-8 text-gray-400" aria-hidden="true" />
            <h2 className="text-base font-semibold text-gray-900">No active quality events</h2>
            <p className="mt-1 text-sm text-gray-600">
              When the Hospital Manager activates an NQAS, KAYAKALP, or MUSQAN drive, your
              department&apos;s checklist will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((ev) => {
              const countdown = formatDeadlineCountdown(ev.endDate, ev.daysRemaining, ev.isOverdue);
              const total = ev.summary?.totalTasks ?? 0;
              const completed = ev.summary?.completedTasks ?? 0;
              const pending = ev.summary?.pendingTasks ?? 0;
              const percent = ev.summary?.completionPercent ?? 0;
              const barClass =
                percent === 100
                  ? 'bg-success-600'
                  : countdown.urgent
                    ? 'bg-danger-600'
                    : 'bg-primary-600';

              return (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-primary-700">{ev.type}</span>
                      <span className={cn('font-medium tabular-nums', countdown.urgent && 'text-danger-700')}>
                        {countdown.label}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-semibold text-gray-900">{ev.title}</h2>
                    {ev.description && (
                      <p className="mt-1 text-sm text-gray-600">{ev.description}</p>
                    )}

                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-gray-700 tabular-nums">
                          {completed} of {total} completed
                        </span>
                        <span className="font-semibold text-gray-900 tabular-nums">{percent}%</span>
                      </div>
                      <ProgressBar percent={percent} barClass={barClass} />
                      <p className="text-xs text-gray-500 tabular-nums">
                        {total === 0
                          ? 'No department assigned to your login yet — contact HM.'
                          : pending === 0
                            ? 'All checklist items for your department are completed.'
                            : `${pending} item${pending === 1 ? '' : 's'} remaining before deadline`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <Link
                      href={`/admin/quality-events/${ev.id}`}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                      Open Checklist
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Hospital Manager (ADMIN) Command & Readiness Analytics View
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Compact Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Quality Events &amp; Readiness
          </h1>
          <p className="mt-0.5 text-sm text-gray-600">
            Activate hospital-wide NQAS / KAYAKALP / MUSQAN drives, track department in-charges,
            and spot where support is needed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:text-sm"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Manage In-charges
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowCreateForm((v) => !v)}
            className="whitespace-nowrap"
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4" aria-hidden="true" />
                Close Form
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Start New Event
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Start New Event Panel */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateEvent}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Launch Hospital Quality Event
              </h2>
              <p className="text-xs text-gray-500">
                Set a deadline and customize department checklists. Once active, every assigned
                Department In-charge sees their checklist on mobile immediately.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              id="qe-type"
              label="Certification / Event Type"
              value={eventType}
              onChange={(e) => handleTypeChange(e.target.value as QualityEventType)}
              options={QUALITY_EVENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            <div className="sm:col-span-2">
              <Input
                id="qe-title"
                label="Event Title *"
                placeholder="e.g. NQAS District Hospital Certification — Dec 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                id="qe-deadline"
                type="date"
                label="Target Deadline *"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <div className="mt-1.5 flex items-center gap-1.5">
                {[7, 15, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEndDate(addDaysIsoDate(d))}
                    className="rounded border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="qe-start"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                id="qe-desc"
                label="Brief Note for In-charges (optional)"
                placeholder="e.g. External NQAS assessment team arrives next month. Complete all audits before deadline."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Participating Departments */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">
                Participating Departments ({selectedDeptIds.length} of {departments.length})
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeptIds(departments.map((d) => d.id))}
                  className="text-xs font-medium text-primary-700 hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedDeptIds([])}
                  className="text-xs font-medium text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => {
                const selected = selectedDeptIds.includes(dept.id);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDeptSelection(dept.id)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                      selected
                        ? 'border-primary-600 bg-primary-50 text-primary-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {dept.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist Customization (Common + Per-Department) */}
          <div className="grid gap-5 border-t border-gray-100 pt-4 lg:grid-cols-2">
            <div>
              <Textarea
                id="qe-common-tasks"
                label="Hospital-Wide Common Checklist (applied to every department)"
                hint="One checklist pointer per line (e.g. Quality team meeting register is properly filled or not)."
                rows={5}
                value={commonTasksText}
                onChange={(e) => setCommonTasksText(e.target.value)}
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    id="qe-dept-checklist-picker"
                    label="Department-Specific Checklist Preview & Customizer"
                    value={editingDeptId}
                    onChange={(e) => setEditingDeptId(e.target.value)}
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  />
                </div>
              </div>

              {editingDept && (
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-600">
                    Pointers for <span className="font-semibold text-gray-900">{editingDept.name}</span>{' '}
                    ({currentEditingDeptTasks.length}):
                  </p>
                  {currentEditingDeptTasks.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Only hospital-wide common pointers will be added for this department.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {currentEditingDeptTasks.map((taskTitle, index) => (
                        <li
                          key={`${editingDept.id}-${index}`}
                          className="flex items-start justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800"
                        >
                          <span>{taskTitle}</span>
                          <button
                            type="button"
                            onClick={() => removeDepartmentPointer(index)}
                            className="shrink-0 text-gray-400 hover:text-danger-600"
                            aria-label={`Remove pointer: ${taskTitle}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      value={deptPointerInput}
                      onChange={(e) => setDeptPointerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDepartmentPointer();
                        }
                      }}
                      placeholder={`Add custom pointer for ${editingDept.name}…`}
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={addDepartmentPointer}>
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={activateNow}
                onChange={(e) => setActivateNow(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Activate immediately for department in-charges</span>
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={saving}>
                Activate Event
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Error or Empty States */}
      {loadError ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm text-danger-800">
          <p>{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void loadBaseData()}
          >
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-gray-900">No quality events launched yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
            Start an NQAS, KAYAKALP, or MUSQAN certification event with a target deadline to push
            department-wise checklists directly to every Department In-charge.
          </p>
          <Button type="button" size="sm" className="mt-4" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Start First Event
          </Button>
        </div>
      ) : (
        <>
          {/* Events Selector Strip */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((ev) => {
              const selected = selectedEventId === ev.id;
              const countdown = formatDeadlineCountdown(ev.endDate, ev.daysRemaining, ev.isOverdue);
              const pct = ev.summary?.completionPercent ?? 0;

              return (
                <div
                  key={ev.id}
                  className={cn(
                    'rounded-xl border bg-white p-4 transition-colors',
                    selected ? 'border-primary-600 ring-1 ring-primary-600' : 'border-gray-200'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEventId(ev.id)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {ev.type} ·{' '}
                        <span
                          className={cn(
                            ev.isArchived
                              ? 'text-gray-500'
                              : ev.isActive
                                ? 'text-success-700'
                                : 'text-warning-700'
                          )}
                        >
                          {ev.isArchived ? 'Archived' : ev.isActive ? 'Active' : 'Paused'}
                        </span>
                      </span>
                      <span className={cn('tabular-nums', countdown.urgent && 'font-medium text-danger-700')}>
                        {countdown.label}
                      </span>
                    </div>
                    <h2 className="mt-1 truncate text-base font-semibold text-gray-900" title={ev.title}>
                      {ev.title}
                    </h2>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-600 tabular-nums">
                        <span>
                          {ev.summary?.completedTasks ?? 0} / {ev.summary?.totalTasks ?? 0} tasks
                          done
                        </span>
                        <span className="font-semibold text-gray-900">{pct}%</span>
                      </div>
                      <ProgressBar
                        percent={pct}
                        barClass={pct === 100 ? 'bg-success-600' : 'bg-primary-600'}
                      />
                    </div>
                  </button>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-xs">
                    <Link
                      href={`/admin/quality-events/${ev.id}`}
                      className="font-medium text-primary-700 hover:underline"
                    >
                      Open checklists →
                    </Link>
                    <div className="flex items-center gap-2">
                      {!ev.isArchived && (
                        <button
                          type="button"
                          disabled={busyEventId === ev.id}
                          onClick={() => void toggleEventState(ev, { isActive: !ev.isActive })}
                          className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900"
                        >
                          {ev.isActive ? (
                            <>
                              <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              Pause
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              Activate
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyEventId === ev.id}
                        onClick={() => void toggleEventState(ev, { isArchived: !ev.isArchived })}
                        className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-900"
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        {ev.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysed Readiness Section for Selected Event */}
          {selectedEventId && (
            <div className="space-y-5">
              {analyticsLoading && !analytics ? (
                <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white" />
              ) : analytics ? (
                <>
                  {/* 4-Column KPI Strip */}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium text-gray-500">Hospital Readiness</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
                        {analytics.summary.completionPercent}%
                      </p>
                      <div className="mt-2">
                        <ProgressBar
                          percent={analytics.summary.completionPercent}
                          barClass={
                            analytics.summary.completionPercent >= 80
                              ? 'bg-success-600'
                              : analytics.summary.completionPercent >= 40
                                ? 'bg-primary-600'
                                : 'bg-danger-600'
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium text-gray-500">Checklist Items Done</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
                        {analytics.summary.completedTasks}{' '}
                        <span className="text-sm font-normal text-gray-500">
                          / {analytics.summary.totalTasks}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500 tabular-nums">
                        {analytics.summary.pendingTasks} remaining hospital-wide
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium text-gray-500">Departments Ready</p>
                      <p className="mt-1 text-2xl font-bold text-success-700 tabular-nums">
                        {analytics.summary.readyDepartments}{' '}
                        <span className="text-sm font-normal text-gray-500">
                          / {analytics.summary.totalDepartments}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500 tabular-nums">
                        {analytics.summary.onTrackDepartments} on track
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium text-gray-500">Support Needed</p>
                      <p className="mt-1 text-2xl font-bold text-danger-700 tabular-nums">
                        {analytics.summary.supportRequiredDepartments}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 tabular-nums">
                        {analytics.summary.needsAttentionDepartments} need attention ·{' '}
                        {analytics.summary.unassignedDepartments} without in-charge
                      </p>
                    </div>
                  </div>

                  {/* Actionable Analysis: Where Support Is Needed + Recurring Hospital-Wide Gaps */}
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          Where HM Support Is Needed
                        </h3>
                        <span className="text-xs font-medium text-gray-500 tabular-nums">
                          {supportPriorityDepartments.length} department
                          {supportPriorityDepartments.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Departments lagging behind target pace, missing an in-charge, or facing
                        pending items close to the deadline.
                      </p>

                      {supportPriorityDepartments.length === 0 ? (
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-800">
                          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                          All participating departments are currently on track or ready.
                        </div>
                      ) : (
                        <ul className="mt-4 divide-y divide-gray-100">
                          {supportPriorityDepartments.slice(0, 6).map((dept) => {
                            const meta = READINESS_META[dept.readinessLevel];
                            return (
                              <li key={dept.departmentId} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {dept.departmentName}
                                      <span className={cn('ml-2 text-xs font-medium', meta.textClass)}>
                                        · {meta.label}
                                      </span>
                                    </p>
                                    {dept.supportReason && (
                                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600">
                                        <AlertTriangle
                                          className="h-3.5 w-3.5 shrink-0 text-warning-600"
                                          aria-hidden="true"
                                        />
                                        {dept.supportReason}
                                      </p>
                                    )}
                                  </div>
                                  <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                                    {dept.completionPercent}%
                                  </span>
                                </div>

                                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                                  {dept.incharges.length > 0 ? (
                                    <span className="inline-flex flex-wrap items-center gap-2">
                                      <UserCheck className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                                      {dept.incharges.map((inc) => (
                                        <span key={inc.id} className="inline-flex items-center gap-1">
                                          <strong className="font-medium text-gray-700">
                                            {inc.name}
                                          </strong>
                                          {inc.phone && (
                                            <a
                                              href={`tel:${inc.phone}`}
                                              className="inline-flex items-center gap-0.5 text-primary-700 hover:underline"
                                            >
                                              <Phone className="h-3 w-3" aria-hidden="true" />
                                              {inc.phone}
                                            </a>
                                          )}
                                        </span>
                                      ))}
                                    </span>
                                  ) : (
                                    <Link
                                      href="/admin/staff"
                                      className="font-medium text-danger-700 hover:underline"
                                    >
                                      No in-charge assigned — Assign in Staff &amp; Access →
                                    </Link>
                                  )}

                                  <Link
                                    href={`/admin/quality-events/${analytics.event.id}?departmentId=${dept.departmentId}`}
                                    className="font-medium text-primary-700 hover:underline"
                                  >
                                    View {dept.pending} pending →
                                  </Link>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <h3 className="text-base font-semibold text-gray-900">
                        Hospital-Wide Pending Gaps
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Checklist items still incomplete across multiple departments — ideal for a
                        common hospital-level briefing or support session.
                      </p>

                      {analytics.commonGaps.length === 0 ? (
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-800">
                          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                          No pending checklist items remaining for this event.
                        </div>
                      ) : (
                        <ul className="mt-4 divide-y divide-gray-100">
                          {analytics.commonGaps.map((gap) => (
                            <li key={gap.title} className="py-2.5 first:pt-0 last:pb-0">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-gray-900">{gap.title}</p>
                                <span className="shrink-0 text-xs font-semibold text-danger-700 tabular-nums">
                                  {gap.pendingDepartmentsCount} / {gap.totalDepartmentsCount} depts
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Pending in: {gap.departmentNames.slice(0, 5).join(', ')}
                                {gap.departmentNames.length > 5
                                  ? ` +${gap.departmentNames.length - 5} more`
                                  : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Full Department-Wise Analysed Breakdown */}
                  <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4 sm:p-5">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Department-Wise Readiness Breakdown
                        </h3>
                        <p className="text-xs text-gray-500">
                          Click any department row to inspect exact pending pointers and in-charge
                          remarks.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search department or in-charge…"
                            className="w-52 rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>

                        <div
                          className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5"
                          role="group"
                          aria-label="Filter departments by readiness"
                        >
                          {(
                            [
                              ['all', 'All'],
                              ['support_required', 'Support'],
                              ['needs_attention', 'Attention'],
                              ['on_track', 'On track'],
                              ['ready', 'Ready'],
                            ] as const
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setReadinessFilter(key)}
                              className={cn(
                                'whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                readinessFilter === key
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {filteredDepartments.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500">
                        No departments match the current filter.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-medium text-gray-500">
                              <th className="px-4 py-3">Department &amp; In-charge</th>
                              <th className="px-4 py-3">Readiness</th>
                              <th className="px-4 py-3 text-right">Completed</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">What Needs To Be Done</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredDepartments.map((dept) => {
                              const meta = READINESS_META[dept.readinessLevel];
                              const expanded = expandedDeptId === dept.departmentId;
                              return (
                                <tr
                                  key={dept.departmentId}
                                  className="align-top transition-colors hover:bg-gray-50/60"
                                >
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedDeptId(expanded ? null : dept.departmentId)
                                      }
                                      className="text-left"
                                    >
                                      <p className="font-semibold text-gray-900">
                                        {dept.departmentName}
                                      </p>
                                      <p className="mt-0.5 text-xs text-gray-500">
                                        {dept.incharges.length > 0
                                          ? `In-charge: ${dept.incharges.map((i) => i.name).join(', ')}`
                                          : 'Unassigned — no in-charge'}
                                      </p>
                                    </button>
                                  </td>
                                  <td className="w-40 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <ProgressBar
                                        percent={dept.completionPercent}
                                        barClass={meta.barClass}
                                      />
                                      <span className="w-10 text-right text-xs font-semibold text-gray-900 tabular-nums">
                                        {dept.completionPercent}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-700 tabular-nums">
                                    {dept.completed} / {dept.total}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    <span className={cn('text-xs font-semibold', meta.textClass)}>
                                      {meta.label}
                                    </span>
                                  </td>
                                  <td className="max-w-md px-4 py-3">
                                    {dept.pendingTasks.length === 0 ? (
                                      <span className="text-xs text-success-700">
                                        All items verified
                                      </span>
                                    ) : (
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-700">
                                          {dept.pendingTasks[0].title}
                                          {dept.pendingTasks.length > 1 && !expanded && (
                                            <button
                                              type="button"
                                              onClick={() => setExpandedDeptId(dept.departmentId)}
                                              className="ml-1.5 font-medium text-primary-700 hover:underline"
                                            >
                                              +{dept.pendingTasks.length - 1} more
                                            </button>
                                          )}
                                        </p>
                                        {expanded &&
                                          dept.pendingTasks.slice(1).map((pt) => (
                                            <p key={pt.id} className="text-xs text-gray-700">
                                              · {pt.title}
                                              {pt.remarks && (
                                                <span className="ml-1 text-warning-700">
                                                  (Note: {pt.remarks})
                                                </span>
                                              )}
                                            </p>
                                          ))}
                                        {dept.pendingTasks[0].remarks && (
                                          <p className="text-xs text-warning-700">
                                            Note: {dept.pendingTasks[0].remarks}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <Link
                                      href={`/admin/quality-events/${analytics.event.id}?departmentId=${dept.departmentId}`}
                                      className="text-xs font-medium text-primary-700 hover:underline"
                                    >
                                      Checklist →
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

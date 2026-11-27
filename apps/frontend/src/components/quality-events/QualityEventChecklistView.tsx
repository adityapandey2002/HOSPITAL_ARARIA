'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Clock,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button, Select } from '@dh-araria/ui/components';
import { UserRole, type Department } from '@dh-araria/shared/types';
import { cn, formatDateTime } from '@dh-araria/shared/utils';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { api, handleApiResponse } from '@/lib/api';
import {
  formatDeadlineCountdown,
  type QualityEventItem,
  type QualityEventTaskItem,
} from '@/lib/quality-events';

export function QualityEventChecklistView() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const eventId = params.id;
  const initialDeptId = searchParams.get('departmentId') ?? '';

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStaff = isAdmin || user?.role === UserRole.STAFF;

  const [event, setEvent] = useState<QualityEventItem | null>(null);
  const [tasks, setTasks] = useState<QualityEventTaskItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDeptId);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // Per-task remark/support note editor
  const [remarkTaskId, setRemarkTaskId] = useState<string | null>(null);
  const [remarkDraft, setRemarkDraft] = useState('');

  // Admin add-task bar
  const [newTaskDeptId, setNewTaskDeptId] = useState<string>(initialDeptId || 'ALL');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [evRes, tasksRes, deptsRes] = await Promise.all([
        api.get<QualityEventItem>(`/quality-events/${eventId}`),
        api.get<QualityEventTaskItem[]>(`/quality-events/${eventId}/tasks`),
        api.get<Department[]>('/departments', { limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      ]);
      setEvent(handleApiResponse(evRes) ?? null);
      setTasks(handleApiResponse(tasksRes) ?? []);
      setDepartments(
        (handleApiResponse(deptsRes) ?? []).filter((d) => d.isActive !== false)
      );
    } catch {
      setLoadError('Could not load this quality event checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) return;
    void loadData();
  }, [isAuthenticated, isStaff, loadData]);

  const participatingDepartments = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      map.set(task.departmentId, task.departmentName ?? task.departmentId);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedDeptId && t.departmentId !== selectedDeptId) return false;
      if (statusFilter === 'pending' && t.isCompleted) return false;
      if (statusFilter === 'completed' && !t.isCompleted) return false;
      return true;
    });
  }, [tasks, selectedDeptId, statusFilter]);

  const groupedByDept = useMemo(() => {
    const map = new Map<string, { name: string; items: QualityEventTaskItem[] }>();
    for (const task of visibleTasks) {
      const entry = map.get(task.departmentId) ?? {
        name: task.departmentName ?? task.departmentId,
        items: [],
      };
      entry.items.push(task);
      map.set(task.departmentId, entry);
    }
    return [...map.entries()];
  }, [visibleTasks]);

  const overallStats = useMemo(() => {
    const scoped = selectedDeptId
      ? tasks.filter((t) => t.departmentId === selectedDeptId)
      : tasks;
    const total = scoped.length;
    const completed = scoped.filter((t) => t.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending: Math.max(0, total - completed), percent };
  }, [tasks, selectedDeptId]);

  const toggleTask = async (task: QualityEventTaskItem) => {
    setBusyTaskId(task.id);
    const nextCompleted = !task.isCompleted;
    // Optimistic update for responsive mobile tapping
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null,
              completedByName: nextCompleted ? user?.name ?? 'You' : null,
            }
          : item
      )
    );

    try {
      await api.patch(`/quality-events/${eventId}/tasks/${task.id}`, {
        isCompleted: nextCompleted,
      });
    } catch {
      toast.error('Could not update checklist item');
      await loadData();
    } finally {
      setBusyTaskId(null);
    }
  };

  const saveRemark = async (task: QualityEventTaskItem) => {
    setBusyTaskId(task.id);
    try {
      await api.patch(`/quality-events/${eventId}/tasks/${task.id}`, {
        isCompleted: task.isCompleted,
        remarks: remarkDraft.trim(),
      });
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, description: remarkDraft.trim() || null } : item
        )
      );
      setRemarkTaskId(null);
      setRemarkDraft('');
      toast.success('Note saved for Hospital Manager');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      await api.post(`/quality-events/${eventId}/tasks`, {
        departmentId: newTaskDeptId || 'ALL',
        title: newTaskTitle.trim(),
      });
      setNewTaskTitle('');
      toast.success('Checklist pointer added');
      await loadData();
    } catch {
      toast.error('Could not add checklist pointer');
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setBusyTaskId(taskId);
    try {
      await api.delete(`/quality-events/${eventId}/tasks/${taskId}`);
      setTasks((prev) => prev.filter((item) => item.id !== taskId));
      toast.success('Checklist pointer removed');
    } catch {
      toast.error('Failed to remove pointer');
    } finally {
      setBusyTaskId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-600" role="status">
        Checking your account…
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
        <Clock className="mx-auto mb-3 h-7 w-7 text-primary-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-gray-900">Sign in required</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sign in with your Hospital Manager or Department In-charge account to update this
          checklist.
        </p>
        <Link
          href={`/login?redirect=/admin/quality-events/${eventId}`}
          className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const countdown = formatDeadlineCountdown(
    event?.endDate,
    event?.daysRemaining,
    event?.isOverdue
  );

  return (
    <div className="space-y-5">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/quality-events"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to quality events
          </Link>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            {event?.title ?? 'Quality Event Checklist'}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {event?.type && <span className="font-semibold text-primary-700">{event.type}</span>}
            <span aria-hidden="true">·</span>
            <span className={cn('tabular-nums', countdown.urgent && 'font-semibold text-danger-700')}>
              {countdown.label}
            </span>
            {event && !event.isActive && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-warning-700">Paused</span>
              </>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadData()}
          loading={loading}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Live Progress Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 tabular-nums">
            {overallStats.completed} of {overallStats.total} items completed
          </p>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {overallStats.percent}%
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-200',
              overallStats.percent === 100 ? 'bg-success-600' : 'bg-primary-600'
            )}
            style={{ width: `${overallStats.percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 tabular-nums">
          {overallStats.pending === 0 && overallStats.total > 0
            ? 'All checklist items shown here are marked complete.'
            : `${overallStats.pending} item${overallStats.pending === 1 ? '' : 's'} still pending. Tap a checkbox when done, or add a note if HM support is required.`}
        </p>
      </div>

      {/* Admin: Add New Pointer Inline */}
      {isAdmin && (
        <form
          onSubmit={handleAddTask}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <p className="mb-2.5 text-xs font-semibold text-gray-700">
            Add Checklist Pointer to This Event
          </p>
          <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
            <Select
              id="add-task-dept"
              aria-label="Target department"
              value={newTaskDeptId}
              onChange={(e) => setNewTaskDeptId(e.target.value)}
              options={[
                { value: 'ALL', label: 'All participating departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. The ANCOS checklist is filled or not"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            />
            <Button type="submit" size="sm" loading={addingTask} className="whitespace-nowrap">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Pointer
            </Button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5"
          role="group"
          aria-label="Filter checklist items"
        >
          {(
            [
              ['all', 'All'],
              ['pending', 'Pending'],
              ['completed', 'Completed'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {participatingDepartments.length > 1 && (
          <div className="w-full sm:w-64">
            <Select
              id="filter-checklist-dept"
              aria-label="Filter by department"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              options={[
                { value: '', label: `All departments (${participatingDepartments.length})` },
                ...participatingDepartments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Checklist Content */}
      {loadError ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm text-danger-800">
          {loadError}
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : groupedByDept.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          {tasks.length === 0
            ? 'No checklist items are assigned to your department for this event.'
            : 'No checklist items match this filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDept.map(([deptId, group]) => {
            const deptTotal = group.items.length;
            const deptDone = group.items.filter((i) => i.isCompleted).length;

            return (
              <div key={deptId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                  <h2 className="text-sm font-semibold text-gray-900 sm:text-base">{group.name}</h2>
                  <span className="text-xs font-medium text-gray-600 tabular-nums">
                    {deptDone} / {deptTotal} done
                  </span>
                </div>

                <ul className="divide-y divide-gray-100">
                  {group.items.map((task) => {
                    const isBusy = busyTaskId === task.id;
                    const editingRemark = remarkTaskId === task.id;

                    return (
                      <li key={task.id} className="p-3 sm:px-4 sm:py-3.5">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={task.isCompleted}
                            aria-label={task.title}
                            disabled={isBusy}
                            onClick={() => void toggleTask(task)}
                            className={cn(
                              'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 sm:h-7 sm:w-7',
                              task.isCompleted
                                ? 'border-success-600 bg-success-600 text-white'
                                : 'border-gray-300 bg-white text-transparent hover:border-primary-500'
                            )}
                          >
                            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-sm font-medium leading-snug',
                                task.isCompleted
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-900'
                              )}
                            >
                              {task.title}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                              {task.isCompleted ? (
                                <span className="text-success-700">
                                  Completed
                                  {task.completedByName ? ` by ${task.completedByName}` : ''}
                                  {task.completedAt ? ` · ${formatDateTime(task.completedAt)}` : ''}
                                </span>
                              ) : (
                                <span>Pending verification</span>
                              )}

                              {task.description && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-medium text-warning-800">
                                    Note: {task.description}
                                  </span>
                                </>
                              )}
                            </div>

                            {editingRemark && (
                              <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                                <input
                                  type="text"
                                  value={remarkDraft}
                                  onChange={(e) => setRemarkDraft(e.target.value)}
                                  placeholder="Add remark or mention what support is needed from HM…"
                                  maxLength={500}
                                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <div className="flex gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    loading={isBusy}
                                    onClick={() => void saveRemark(task)}
                                  >
                                    Save Note
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRemarkTaskId(null);
                                      setRemarkDraft('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (editingRemark) {
                                  setRemarkTaskId(null);
                                  setRemarkDraft('');
                                } else {
                                  setRemarkTaskId(task.id);
                                  setRemarkDraft(task.description ?? '');
                                }
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                              title="Add remark or request HM support"
                              aria-label={`Add note for ${task.title}`}
                            >
                              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleDeleteTask(task.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                                title="Remove checklist pointer"
                                aria-label={`Remove ${task.title}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

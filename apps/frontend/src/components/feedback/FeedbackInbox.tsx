'use client';

import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Lock,
  LogIn,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react';
import type {
  Department,
  Feedback,
  FeedbackScope,
  FeedbackStats,
  PaginationMeta,
} from '@dh-araria/shared/types';
import { FeedbackServiceArea, FeedbackStatus, UserRole } from '@dh-araria/shared/types';
import { FEEDBACK_SERVICE_AREA_LABELS, FEEDBACK_STATUS_LABELS } from '@dh-araria/shared/constants';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Button, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { feedbackTimestamp, getErrorMessage, toFeedbackQuery } from '@/lib/feedback';
import { FeedbackAccessPanel } from './FeedbackAccessPanel';
import { RatingDisplay } from './RatingStars';

const PAGE_SIZE = 10;

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const STATUS_BADGE: Record<FeedbackStatus, BadgeVariant> = {
  [FeedbackStatus.NEW]: 'warning',
  [FeedbackStatus.ACKNOWLEDGED]: 'primary',
  [FeedbackStatus.RESOLVED]: 'success',
};

const STAT_TONES = {
  primary: 'bg-primary-100 text-primary-600',
  warning: 'bg-warning-100 text-warning-600',
  success: 'bg-success-100 text-success-600',
  danger: 'bg-danger-100 text-danger-600',
} as const;

type StatTone = keyof typeof STAT_TONES;

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: StatTone;
}

function StatCard({ label, value, hint, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
            STAT_TONES[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  item: Feedback;
  pendingStatus: FeedbackStatus | null;
  actionsDisabled: boolean;
  onStatusChange: (item: Feedback, status: FeedbackStatus) => void;
}

function FeedbackCard({ item, pendingStatus, actionsDisabled, onStatusChange }: FeedbackCardProps) {
  const stamp = feedbackTimestamp(item.createdAt);
  const serviceArea = FEEDBACK_SERVICE_AREA_LABELS[item.serviceArea] ?? item.serviceArea;
  const criteria = [
    { label: 'Cleanliness', value: item.cleanliness },
    { label: 'Staff behaviour', value: item.staffBehaviour },
    { label: 'Waiting time', value: item.waitTime },
  ].filter((criterion) => typeof criterion.value === 'number');
  const hasContact = Boolean(item.name || item.phone || item.email);

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {item.departmentName ?? 'Department'}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">{serviceArea}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge
            id={`feedback-status-${item.id}`}
            tabIndex={-1}
            variant={STATUS_BADGE[item.status]}
            dot
          >
            {FEEDBACK_STATUS_LABELS[item.status] ?? item.status}
          </Badge>
          <RatingDisplay value={item.rating} />
        </div>
      </div>

      <p className="mt-4 break-words text-gray-700">
        {item.comment?.trim() ? (
          <span className="whitespace-pre-line">{item.comment}</span>
        ) : (
          <span className="italic text-gray-400">No comment provided.</span>
        )}
      </p>

      {criteria.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
          {criteria.map((criterion) => (
            <div key={criterion.label} className="flex items-center gap-1">
              <dt>{criterion.label}:</dt>
              <dd className="font-medium text-gray-900">{criterion.value}/5</dd>
            </div>
          ))}
        </dl>
      )}

      {hasContact && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
            {item.name && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {item.name}
              </span>
            )}
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-primary-700"
              >
                <Phone className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {item.phone}
              </a>
            )}
            {item.email && (
              <a
                href={`mailto:${item.email}`}
                className="inline-flex items-center gap-1.5 break-all rounded transition-colors hover:text-primary-700"
              >
                <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                {item.email}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <time dateTime={stamp.iso} className="text-sm text-gray-500">
          {stamp.label}
        </time>

        <div className="flex flex-wrap gap-2">
          {item.status === FeedbackStatus.NEW && (
            <Button
              type="button"
              size="sm"
              onClick={() => onStatusChange(item, FeedbackStatus.ACKNOWLEDGED)}
              loading={pendingStatus === FeedbackStatus.ACKNOWLEDGED}
              disabled={actionsDisabled || pendingStatus !== null}
            >
              Acknowledge
            </Button>
          )}
          {item.status !== FeedbackStatus.RESOLVED && (
            <Button
              type="button"
              size="sm"
              variant="success"
              onClick={() => onStatusChange(item, FeedbackStatus.RESOLVED)}
              loading={pendingStatus === FeedbackStatus.RESOLVED}
              disabled={actionsDisabled || pendingStatus !== null}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <li key={row} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-24 rounded-full bg-gray-200" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
          </div>
          <div className="mt-5 h-8 w-40 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

export function FeedbackInbox() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [scope, setScope] = useState<FeedbackScope | null>(null);
  const [scopeLoading, setScopeLoading] = useState(true);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [items, setItems] = useState<Feedback[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [serviceAreaFilter, setServiceAreaFilter] = useState<FeedbackServiceArea | ''>('');
  const [page, setPage] = useState(1);

  const [updating, setUpdating] = useState<{ id: string; status: FeedbackStatus } | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadScope = useCallback(async () => {
    setScopeLoading(true);
    setScopeError(null);

    try {
      const response = await api.get<FeedbackScope>('/feedback/scope');
      let nextScope = handleApiResponse(response);

      // ADMIN sees every department. If the scope payload omits the list, fill
      // it from the public department directory so the filters stay usable.
      if (nextScope.all && nextScope.departments.length === 0) {
        try {
          const departmentResponse = await api.get<Department[]>('/departments', {
            limit: 100,
            sortBy: 'name',
            sortOrder: 'asc',
          });
          const departments = (handleApiResponse(departmentResponse) ?? [])
            .filter((department) => department.isActive !== false)
            .map((department) => ({ id: department.id, name: department.name }));

          nextScope = { ...nextScope, departments };
        } catch {
          // Global access still works; the department filter will be empty.
        }
      }

      setScope(nextScope);
    } catch (error) {
      setScopeError(getErrorMessage(error, 'We could not load your feedback access.'));
    } finally {
      setScopeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setScope(null);
      setScopeLoading(false);
      setItems([]);
      setStats(null);
      return;
    }

    void loadScope();
  }, [authLoading, isAuthenticated, loadScope]);

  const hasAccess = Boolean(scope && (scope.all || scope.departments.length > 0));

  const loadList = useCallback(async () => {
    if (!scope || (!scope.all && scope.departments.length === 0)) return;

    setListLoading(true);
    setListError(null);

    try {
      const response = await api.get<Feedback[]>(
        '/feedback',
        toFeedbackQuery({
          page,
          limit: PAGE_SIZE,
          departmentId: departmentFilter || undefined,
          status: statusFilter || undefined,
          serviceArea: serviceAreaFilter || undefined,
        })
      );

      setItems(handleApiResponse(response) ?? []);
      setMeta(response.meta ?? null);
    } catch (error) {
      setListError(getErrorMessage(error, 'We could not load feedback responses.'));
    } finally {
      setListLoading(false);
    }
  }, [scope, page, departmentFilter, statusFilter, serviceAreaFilter]);

  const loadStats = useCallback(async () => {
    if (!scope || (!scope.all && scope.departments.length === 0)) return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      const params: Record<string, unknown> = {};
      if (departmentFilter) params.departmentId = departmentFilter;

      const response = await api.get<FeedbackStats>('/feedback/stats', params);
      setStats(handleApiResponse(response));
    } catch (error) {
      setStatsError(getErrorMessage(error, 'Statistics are unavailable right now.'));
    } finally {
      setStatsLoading(false);
    }
  }, [scope, departmentFilter]);

  useEffect(() => {
    if (!hasAccess) return;
    void loadList();
  }, [hasAccess, loadList]);

  useEffect(() => {
    if (!hasAccess) return;
    void loadStats();
  }, [hasAccess, loadStats]);

  const resetPageAnd = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const clearFilters = () => {
    setDepartmentFilter('');
    setStatusFilter('');
    setServiceAreaFilter('');
    setPage(1);
  };

  const focusStatusBadge = (id: string) => {
    window.setTimeout(() => document.getElementById(`feedback-status-${id}`)?.focus(), 0);
  };

  const handleStatusChange = async (item: Feedback, status: FeedbackStatus) => {
    setUpdating({ id: item.id, status });
    setActionError(null);
    setActionMessage('');

    try {
      const response = await api.patch<Feedback>(`/feedback/${item.id}/status`, { status });
      handleApiResponse(response);

      if (statusFilter) {
        // The row may no longer match a status filter; let the API decide.
        await loadList();
      } else {
        setItems((current) =>
          current.map((feedback) => (feedback.id === item.id ? { ...feedback, status } : feedback))
        );
      }

      setActionMessage(
        `Feedback from ${item.departmentName ?? 'the department'} marked ${(
          FEEDBACK_STATUS_LABELS[status] ?? status
        ).toLowerCase()}.`
      );
      void loadStats();
      focusStatusBadge(item.id);
    } catch (error) {
      setActionError(getErrorMessage(error, 'We could not update the feedback status.'));
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div
            className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 text-gray-600"
            role="status"
            aria-live="polite"
          >
            <RefreshCw className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
            Checking your account…
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Lock className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Staff sign-in required</h2>
            <p className="mt-2 text-gray-600">
              The feedback inbox is available to Hospital Managers and department heads. Sign in to
              review citizen feedback for your departments.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <Link
                href="/login?redirect=/feedback/inbox"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in to the inbox
              </Link>
              <Link
                href="/feedback"
                className="rounded px-2 py-1 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Go to the public feedback form
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (scopeLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div
            className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 text-gray-600"
            role="status"
            aria-live="polite"
          >
            <RefreshCw className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
            Loading your feedback access…
          </div>
        </div>
      </section>
    );
  }

  if (scopeError) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div
            className="border-danger-200 mx-auto max-w-lg rounded-2xl border bg-danger-50 p-6 text-center sm:p-8"
            role="alert"
          >
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-danger-600" aria-hidden="true" />
            <h2 className="text-danger-900 text-xl font-bold">
              We could not load your feedback access
            </h2>
            <p className="text-danger-800 mt-2">{scopeError}</p>
            <Button
              type="button"
              variant="outline"
              className="border-danger-300 mt-5 text-danger-700 hover:bg-danger-100"
              onClick={() => void loadScope()}
            >
              Try again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!scope) {
    return null;
  }

  if (!scope.all && scope.departments.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="border-warning-200 mx-auto max-w-lg rounded-2xl border bg-warning-50 p-6 text-center sm:p-8">
            <Lock className="mx-auto mb-4 h-8 w-8 text-warning-600" aria-hidden="true" />
            <h2 className="text-warning-900 text-xl font-bold">Feedback access not granted</h2>
            <p className="text-warning-800 mt-2">
              Your account does not have feedback access yet. Ask the Hospital Manager to grant a
              department.
            </p>
            <Link
              href="/feedback"
              className="text-warning-800 mt-5 inline-flex items-center justify-center rounded-lg border-2 border-warning-600 px-4 py-2 font-medium transition-colors hover:bg-warning-100 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2"
            >
              Go to the public feedback form
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const departmentOptions = [
    { value: '', label: 'All departments' },
    ...scope.departments.map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...Object.values(FeedbackStatus).map((status) => ({
      value: status,
      label: FEEDBACK_STATUS_LABELS[status] ?? status,
    })),
  ];

  const serviceAreaOptions = [
    { value: '', label: 'All service areas' },
    ...Object.values(FeedbackServiceArea).map((serviceArea) => ({
      value: serviceArea,
      label: FEEDBACK_SERVICE_AREA_LABELS[serviceArea] ?? serviceArea,
    })),
  ];

  const totalValue = stats ? stats.total.toLocaleString('en-IN') : statsLoading ? '…' : '—';
  const averageValue =
    stats && stats.total > 0 ? stats.averageRating.toFixed(1) : statsLoading ? '…' : '—';
  const newValue = stats
    ? String(stats.byStatus[FeedbackStatus.NEW] ?? 0)
    : statsLoading
      ? '…'
      : '—';
  const resolvedValue = stats
    ? String(stats.byStatus[FeedbackStatus.RESOLVED] ?? 0)
    : statsLoading
      ? '…'
      : '—';

  const hasFilters = Boolean(departmentFilter || statusFilter || serviceAreaFilter);
  const isBusy = listLoading || statsLoading;

  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Feedback overview</h2>
            <p className="mt-1 text-sm text-gray-600">
              {scope.all
                ? 'You can see feedback for every department.'
                : `You can see feedback for ${scope.departments.length} department${
                    scope.departments.length === 1 ? '' : 's'
                  }.`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isBusy}
            className="self-start sm:self-auto"
            onClick={() => {
              void loadList();
              void loadStats();
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={statsLoading}>
          <StatCard
            label="Total responses"
            value={totalValue}
            hint={
              departmentFilter ? 'For the selected department' : 'Across accessible departments'
            }
            icon={MessageSquare}
            tone="primary"
          />
          <StatCard
            label="Average rating"
            value={averageValue}
            hint="Out of 5"
            icon={Star}
            tone="warning"
          />
          <StatCard
            label="New"
            value={newValue}
            hint="Awaiting acknowledgement"
            icon={Bell}
            tone="danger"
          />
          <StatCard
            label="Resolved"
            value={resolvedValue}
            hint="Marked as resolved"
            icon={CheckCircle}
            tone="success"
          />
        </div>

        {statsError && (
          <p
            role="status"
            className="mt-3 flex flex-wrap items-center gap-2 text-sm text-danger-700"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {statsError}
            <Button type="button" variant="ghost" size="sm" onClick={() => void loadStats()}>
              Retry
            </Button>
          </p>
        )}

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="sr-only">Filter feedback</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              id="feedback-filter-department"
              label="Department"
              value={departmentFilter}
              onChange={(event) => resetPageAnd(() => setDepartmentFilter(event.target.value))}
              options={departmentOptions}
            />
            <Select
              id="feedback-filter-status"
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                resetPageAnd(() => setStatusFilter(event.target.value as FeedbackStatus | ''))
              }
              options={statusOptions}
            />
            <Select
              id="feedback-filter-service-area"
              label="Service area"
              value={serviceAreaFilter}
              onChange={(event) =>
                resetPageAnd(() =>
                  setServiceAreaFilter(event.target.value as FeedbackServiceArea | '')
                )
              }
              options={serviceAreaOptions}
            />
          </div>

          {hasFilters && (
            <div className="mt-3">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {actionMessage && (
          <p
            role="status"
            aria-live="polite"
            className="border-success-200 text-success-800 mt-6 flex items-start gap-2 rounded-xl border bg-success-50 p-3 text-sm"
          >
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{actionMessage}</span>
          </p>
        )}

        {actionError && (
          <p
            role="alert"
            className="border-danger-200 text-danger-800 mt-6 flex items-start gap-2 rounded-xl border bg-danger-50 p-3 text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </p>
        )}

        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Feedback responses</h2>
            <p className="text-sm text-gray-500">
              {meta
                ? `${meta.total.toLocaleString('en-IN')} response${meta.total === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {listLoading
              ? 'Loading feedback responses…'
              : meta
                ? `Showing ${items.length} of ${meta.total} responses.`
                : ''}
          </p>

          {listError ? (
            <div
              className="border-danger-200 rounded-2xl border bg-danger-50 p-6 text-center"
              role="alert"
            >
              <AlertCircle className="mx-auto mb-3 h-7 w-7 text-danger-600" aria-hidden="true" />
              <p className="text-danger-800">{listError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-danger-300 mt-4 text-danger-700 hover:bg-danger-100"
                onClick={() => void loadList()}
              >
                Try again
              </Button>
            </div>
          ) : listLoading && items.length === 0 ? (
            <ListSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <Inbox className="mx-auto mb-3 h-9 w-9 text-gray-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-900">No feedback found</h3>
              <p className="mt-1 text-gray-600">
                {hasFilters
                  ? 'No responses match the selected filters. Try widening your search.'
                  : 'No feedback has been submitted for your departments yet.'}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div
              aria-busy={listLoading}
              className={cn('transition-opacity', listLoading && 'opacity-60')}
            >
              <ul className="space-y-4" aria-label="Feedback responses">
                {items.map((item) => (
                  <FeedbackCard
                    key={item.id}
                    item={item}
                    pendingStatus={updating?.id === item.id ? updating.status : null}
                    actionsDisabled={updating !== null}
                    onStatusChange={(feedback, status) => void handleStatusChange(feedback, status)}
                  />
                ))}
              </ul>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <nav
              aria-label="Feedback pagination"
              className="mt-6 flex flex-wrap items-center justify-between gap-3"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={listLoading || page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={listLoading || page >= meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </div>

        {isAdmin && <FeedbackAccessPanel departments={scope.departments} />}
      </div>
    </section>
  );
}

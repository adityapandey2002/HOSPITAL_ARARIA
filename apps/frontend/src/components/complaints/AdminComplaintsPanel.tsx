'use client';

import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Inbox,
  Phone,
  RefreshCw,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { Department, PaginationMeta } from '@dh-araria/shared/types';
import { ComplaintStatus, UserRole } from '@dh-araria/shared';
import { COMPLAINT_STATUS_LABELS } from '@dh-araria/shared/constants';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Button, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getDepartmentShortName, getDepartmentTagTone } from '@/lib/department-tag';
import { formatDateTime } from '@dh-araria/shared/utils';

const PAGE_SIZE = 10;

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const STATUS_BADGE: Record<ComplaintStatus, BadgeVariant> = {
  [ComplaintStatus.SUBMITTED]: 'warning',
  [ComplaintStatus.UNDER_REVIEW]: 'primary',
  [ComplaintStatus.IN_PROGRESS]: 'primary',
  [ComplaintStatus.RESOLVED]: 'success',
  [ComplaintStatus.CLOSED]: 'default',
  [ComplaintStatus.REJECTED]: 'danger',
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

function DepartmentTag({ name }: { name?: string | null }) {
  const fullName = name?.trim() || 'Department not specified';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset',
        getDepartmentTagTone(name)
      )}
      title={fullName}
      aria-label={`Department: ${fullName}`}
    >
      {getDepartmentShortName(name)}
    </span>
  );
}

interface ComplaintCardProps {
  item: any;
  pendingStatus: ComplaintStatus | null;
  actionsDisabled: boolean;
  onStatusChange: (item: any, status: ComplaintStatus) => void;
  onPhotoOpen: (src: string, alt: string, trigger: HTMLElement) => void;
}

function ComplaintCard({
  item,
  pendingStatus,
  actionsDisabled,
  onStatusChange,
  onPhotoOpen,
}: ComplaintCardProps) {
  const stamp = formatDateTime(item.createdAt);
  const hasImage = typeof item.imageUrl === 'string' && item.imageUrl.length > 0;
  const hasContact = Boolean(item.phone || item.email);
  const isResolved =
    item.complaintStatus === ComplaintStatus.RESOLVED ||
    item.complaintStatus === ComplaintStatus.CLOSED;
  const showResolve = item.complaintStatus !== ComplaintStatus.RESOLVED;

  return (
    <li className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <DepartmentTag name={item.departmentName} />
        <Badge
          id={`complaint-status-${item.id}`}
          tabIndex={-1}
          size="sm"
          variant={STATUS_BADGE[item.complaintStatus as ComplaintStatus]}
          dot
        >
          {COMPLAINT_STATUS_LABELS[item.complaintStatus] ?? item.complaintStatus}
        </Badge>
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="truncate text-base font-semibold text-gray-900" title={item.name}>
          {item.name}
        </h3>
        <time dateTime={item.createdAt} className="text-xs text-gray-500">
          {stamp}
        </time>
      </div>

      <p className="mt-3 line-clamp-4 whitespace-pre-line break-words text-sm text-gray-700">
        {item.complaint ?? item.description}
      </p>

      {hasImage && (
        <button
          type="button"
          onClick={(event) =>
            onPhotoOpen(
              item.imageUrl,
              `Photo attached to complaint by ${item.name}`,
              event.currentTarget
            )
          }
          className="group relative mt-3 block w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`View photo attached to complaint by ${item.name}`}
        >
          <img
            src={item.imageUrl}
            alt={`Photo attached to complaint by ${item.name}`}
            loading="lazy"
            decoding="async"
            className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-gray-950/75 via-gray-950/30 to-transparent px-2 pb-2 pt-6 text-[11px] font-medium text-white">
            <ImageIcon className="h-3.5 w-3.5" />
            View photo
          </span>
        </button>
      )}

      {hasContact && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="truncate">{item.phone || item.email}</span>
        </p>
      )}

      {item.resolution && (
        <div className="mt-3 rounded-lg border border-success-200 bg-success-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-success-700">
            Resolution
          </p>
          <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-gray-700">
            {item.resolution}
          </p>
        </div>
      )}

      <div className="mt-auto border-t border-gray-100 pt-3">
        <div className="grid grid-cols-3 gap-1.5">
          {!isResolved && (
            <>
              <Button
                type="button"
                size="sm"
                className="whitespace-nowrap px-2 text-xs"
                onClick={() => onStatusChange(item, ComplaintStatus.UNDER_REVIEW)}
                loading={pendingStatus === ComplaintStatus.UNDER_REVIEW}
                disabled={actionsDisabled || pendingStatus !== null}
                aria-label={`Move complaint from ${item.name} to review`}
              >
                Review
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                className="whitespace-nowrap px-2 text-xs"
                onClick={() => onStatusChange(item, ComplaintStatus.IN_PROGRESS)}
                loading={pendingStatus === ComplaintStatus.IN_PROGRESS}
                disabled={actionsDisabled || pendingStatus !== null}
                aria-label={`Mark complaint from ${item.name} as in progress`}
              >
                Start
              </Button>
            </>
          )}
          {showResolve && (
            <Button
              type="button"
              size="sm"
              variant="success"
              className={cn(
                'whitespace-nowrap px-2 text-xs',
                isResolved && 'col-span-3'
              )}
              onClick={() => onStatusChange(item, ComplaintStatus.RESOLVED)}
              loading={pendingStatus === ComplaintStatus.RESOLVED}
              disabled={actionsDisabled || pendingStatus !== null}
              aria-label={`Mark complaint from ${item.name} as resolved`}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ListSkeleton() {
  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((row) => (
        <li key={row} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 w-12 rounded bg-gray-200" />
            <div className="h-5 w-20 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-5/6 rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="mt-4 h-28 w-full rounded-xl bg-gray-100" />
          <div className="mt-4 h-8 w-full rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

export function AdminComplaintsPanel() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStaff = isAdmin || user?.role === UserRole.STAFF;

  const [stats, setStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const [updating, setUpdating] = useState<{ id: string; status: ComplaintStatus } | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);
  const photoCloseRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!photo) return;

    const trigger = photoTriggerRef.current;
    photoCloseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPhoto(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [photo]);

  const exportCsv = async () => {
    try {
      const blob = await api.exportComplaintsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaints-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to export complaints.'));
    }
  };

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const response = await api.get<Department[]>('/departments', {
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const active = (handleApiResponse(response) ?? []).filter(
        (department) => department.isActive !== false
      );
      setDepartments(active);
    } catch {
      // Non-fatal — the department filter will simply be empty.
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await api.get<any>('/complaints/stats');
      setStats(handleApiResponse(response));
    } catch (error) {
      setStatsError(getErrorMessage(error, 'Statistics are unavailable right now.'));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: PAGE_SIZE,
      };
      if (departmentFilter) params.departmentId = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get<any[]>('/complaints', params);
      // TransformInterceptor flattens `{ data, meta }` into `{ success, data, meta }`,
      // so `handleApiResponse` already returns the complaint array. Pagination
      // metadata stays on the envelope, exactly as FeedbackInbox consumes it.
      setItems(handleApiResponse(response) ?? []);
      setMeta(response.meta ?? null);
    } catch (error) {
      setListError(getErrorMessage(error, 'We could not load complaints.'));
    } finally {
      setListLoading(false);
    }
  }, [page, departmentFilter, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) return;
    void loadStats();
    void loadList();
  }, [isAuthenticated, isStaff, loadStats, loadList]);

  const resetPageAnd = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const clearFilters = () => {
    setDepartmentFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleStatusChange = async (item: any, status: ComplaintStatus) => {
    setUpdating({ id: item.id, status });
    setActionError(null);
    setActionMessage('');

    try {
      const response = await api.patch<any>(`/complaints/${item.id}/status`, { status });
      handleApiResponse(response);

      setItems((current) =>
        current.map((complaint) =>
          complaint.id === item.id
            ? { ...complaint, complaintStatus: status }
            : complaint
        )
      );

      setActionMessage(
        `Complaint from ${item.name} marked ${(
          COMPLAINT_STATUS_LABELS[status] ?? status
        ).toLowerCase()}.`
      );
      void loadStats();
      window.setTimeout(() => document.getElementById(`complaint-status-${item.id}`)?.focus(), 0);
    } catch (error) {
      setActionError(getErrorMessage(error, 'We could not update the complaint status.'));
    } finally {
      setUpdating(null);
    }
  };

  const openPhoto = (src: string, alt: string, trigger: HTMLElement) => {
    photoTriggerRef.current = trigger;
    setPhoto({ src, alt });
  };

  const totalValue = stats ? stats.total.toLocaleString('en-IN') : statsLoading ? '…' : '—';
  const submittedValue = stats
    ? String(stats.byStatus?.[ComplaintStatus.SUBMITTED] ?? 0)
    : statsLoading
      ? '…'
      : '—';
  const inProgressValue = stats
    ? String(stats.byStatus?.[ComplaintStatus.IN_PROGRESS] ?? 0)
    : statsLoading
      ? '…'
      : '—';
  const resolvedValue = stats
    ? String(stats.byStatus?.[ComplaintStatus.RESOLVED] ?? 0)
    : statsLoading
      ? '…'
      : '—';

  const hasFilters = Boolean(departmentFilter || statusFilter);
  const isBusy = listLoading || statsLoading;

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

  if (!isAuthenticated || !isStaff) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Clock className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Staff sign-in required</h2>
            <p className="mt-2 text-gray-600">
              The complaints admin panel is available to Hospital Managers and staff. Sign in to
              track and resolve complaints.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <Link
                href="/login?redirect=/admin/complaints"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Sign in to the admin panel
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const departmentOptions = [
    { value: '', label: 'All departments' },
    ...departments.map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...Object.values(ComplaintStatus).map((status) => ({
      value: status,
      label: COMPLAINT_STATUS_LABELS[status] ?? status,
    })),
  ];

  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complaints admin panel</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track every complaint live and mark it resolved when fixed.
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="self-start sm:self-auto"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={statsLoading}>
          <StatCard
            label="Total complaints"
            value={totalValue}
            hint="All submitted complaints"
            icon={Inbox}
            tone="primary"
          />
          <StatCard
            label="Submitted"
            value={submittedValue}
            hint="Awaiting review"
            icon={Bell}
            tone="warning"
          />
          <StatCard
            label="In progress"
            value={inProgressValue}
            hint="Being worked on"
            icon={Clock}
            tone="primary"
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
          <h2 className="sr-only">Filter complaints</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              id="complaint-filter-department"
              label="Department"
              value={departmentFilter}
              onChange={(event) => resetPageAnd(() => setDepartmentFilter(event.target.value))}
              options={departmentOptions}
            />
            <Select
              id="complaint-filter-status"
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                resetPageAnd(() => setStatusFilter(event.target.value as ComplaintStatus | ''))
              }
              options={statusOptions}
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
            <h2 className="text-xl font-semibold text-gray-900">Complaints</h2>
            <p className="text-sm text-gray-500">
              {meta
                ? `${meta.total.toLocaleString('en-IN')} complaint${meta.total === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {listLoading
              ? 'Loading complaints…'
              : meta
                ? `Showing ${items.length} of ${meta.total} complaints.`
                : ''}
          </p>

          {listError ? (
            <div className="border-danger-200 rounded-2xl border bg-danger-50 p-6 text-center" role="alert">
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
              <h3 className="text-lg font-semibold text-gray-900">No complaints found</h3>
              <p className="mt-1 text-gray-600">
                {hasFilters
                  ? 'No complaints match the selected filters. Try widening your search.'
                  : 'No complaints have been submitted yet.'}
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
            <div aria-busy={listLoading} className={cn('transition-opacity', listLoading && 'opacity-60')}>
              <ul
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                aria-label="Complaints"
              >
                {items.map((item) => (
                  <ComplaintCard
                    key={item.id}
                    item={item}
                    pendingStatus={updating && updating.id === item.id ? updating.status : null}
                    actionsDisabled={updating !== null}
                    onStatusChange={(complaint, status) =>
                      void handleStatusChange(complaint, status)
                    }
                    onPhotoOpen={openPhoto}
                  />
                ))}
              </ul>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <nav aria-label="Complaint pagination" className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
      </div>

      {photo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Complaint photo"
          onClick={() => setPhoto(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              ref={photoCloseRef}
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute -right-2 -top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Close photo"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <img
              src={photo.src}
              alt={photo.alt}
              className="max-h-[85vh] w-full rounded-2xl bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

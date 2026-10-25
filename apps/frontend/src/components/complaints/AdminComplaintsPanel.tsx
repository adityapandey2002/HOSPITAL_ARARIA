'use client';

import { useCallback, useEffect, useState, type ComponentProps } from 'react';
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
  Star,
  User,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { Department, PaginationMeta } from '@dh-araria/shared/types';
import { ComplaintStatus, UserRole } from '@dh-araria/shared';
import {
  COMPLAINT_STATUS_COLORS,
  COMPLAINT_STATUS_LABELS,
} from '@dh-araria/shared/constants';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Button, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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

interface ComplaintCardProps {
  item: any;
  pendingStatus: ComplaintStatus | null;
  actionsDisabled: boolean;
  onStatusChange: (item: any, status: ComplaintStatus) => void;
}

function ComplaintCard({ item, pendingStatus, actionsDisabled, onStatusChange }: ComplaintCardProps) {
  const stamp = formatDateTime(item.createdAt);
  const departmentName = item.departmentName ?? 'Department';
  const hasImage = Boolean(item.imageUrl);
  const hasContact = Boolean(item.phone || item.email);

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {item.name}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">{departmentName}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge
            id={`complaint-status-${item.id}`}
            tabIndex={-1}
            variant={STATUS_BADGE[item.complaintStatus as ComplaintStatus]}
            dot
          >
            {COMPLAINT_STATUS_LABELS[item.complaintStatus] ?? item.complaintStatus}
          </Badge>
        </div>
      </div>

      <p className="mt-4 break-words text-gray-700">
        <span className="whitespace-pre-line">{item.complaint ?? item.description}</span>
      </p>

      {hasImage && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <ImageIcon className="h-4 w-4" />
          <span>Photo attached</span>
        </div>
      )}

      {hasContact && (
        <div className="mt-3 rounded-xl bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-primary-700"
              >
                <Phone className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {item.phone}
              </a>
            )}
          </div>
        </div>
      )}

      {item.resolution && (
        <div className="mt-4 rounded-xl border border-success-200 bg-success-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-success-700">Resolution</p>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
            {item.resolution}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <time dateTime={item.createdAt} className="text-sm text-gray-500">
          {stamp}
        </time>

        <div className="flex flex-wrap gap-2">
          {item.complaintStatus !== ComplaintStatus.RESOLVED && item.complaintStatus !== ComplaintStatus.CLOSED && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => onStatusChange(item, ComplaintStatus.UNDER_REVIEW)}
                loading={pendingStatus === ComplaintStatus.UNDER_REVIEW}
                disabled={actionsDisabled || pendingStatus !== null}
              >
                Review
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => onStatusChange(item, ComplaintStatus.IN_PROGRESS)}
                loading={pendingStatus === ComplaintStatus.IN_PROGRESS}
                disabled={actionsDisabled || pendingStatus !== null}
              >
                In Progress
              </Button>
            </>
          )}
          {item.complaintStatus !== ComplaintStatus.RESOLVED && (
            <Button
              type="button"
              size="sm"
              variant="success"
              onClick={() => onStatusChange(item, ComplaintStatus.RESOLVED)}
              loading={pendingStatus === ComplaintStatus.RESOLVED}
              disabled={actionsDisabled || pendingStatus !== null}
            >
              Mark Resolved
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

      const response = await api.get<any>('/complaints', params);
      const data = handleApiResponse(response);
      setItems(data.data ?? []);
      setMeta(data.meta ?? null);
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy={statsLoading}>
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
              <ul className="space-y-4" aria-label="Complaints">
                {items.map((item) => (
                  <ComplaintCard
                    key={item.id}
                    item={item}
                    pendingStatus={updating && updating.id === item.id ? updating.status : null}
                    actionsDisabled={updating !== null}
                    onStatusChange={(complaint, status) =>
                      void handleStatusChange(complaint, status)
                    }
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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Inbox, Mail, Phone, RefreshCw, Trash2 } from 'lucide-react';
import { ContactMessageStatus, UserRole } from '@dh-araria/shared';
import { formatDateTime } from '@dh-araria/shared/utils';
import { Badge, Button, Card, Dialog, Pagination, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = Object.values(ContactMessageStatus).map((value) => ({
  value,
  label: value.replaceAll('_', ' '),
}));

const STATUS_VARIANT: Record<ContactMessageStatus, 'warning' | 'primary' | 'success' | 'default'> = {
  NEW: 'warning',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
};

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContactMessagesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStaff = isAdmin || user?.role === UserRole.STAFF;

  const [items, setItems] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get<Record<string, number>>('/contact/stats');
      setStats(handleApiResponse(response) ?? {});
    } catch {
      // The list remains usable when the badge counts fail.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;

      const response = await api.get<ContactMessage[]>('/contact', params);
      setItems(handleApiResponse(response) ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (loadError: any) {
      setError(loadError?.message || 'Could not load contact messages.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) return;
    void loadStats();
    void loadList();
  }, [isAuthenticated, isStaff, loadStats, loadList]);

  const counters = useMemo(
    () => [
      { label: 'New', value: stats.NEW ?? 0, tone: 'warning' as const },
      { label: 'In progress', value: stats.IN_PROGRESS ?? 0, tone: 'primary' as const },
      { label: 'Resolved', value: stats.RESOLVED ?? 0, tone: 'success' as const },
      { label: 'Closed', value: stats.CLOSED ?? 0, tone: 'default' as const },
    ],
    [stats]
  );

  const updateStatus = async (status: ContactMessageStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const response = await api.put<ContactMessage>(`/contact/${selected.id}/status`, { status });
      const updated = handleApiResponse(response);
      setSelected(updated ?? { ...selected, status });
      toast.success('Status updated');
      await Promise.all([loadList(), loadStats()]);
    } catch (updateError: any) {
      toast.error('Could not update status', { description: updateError?.message });
    } finally {
      setUpdating(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm('Delete this contact message?')) return;
    setDeleting(true);
    try {
      await api.delete(`/contact/${selected.id}`);
      toast.success('Message deleted');
      setSelected(null);
      await Promise.all([loadList(), loadStats()]);
    } catch (deleteError: any) {
      toast.error('Could not delete message', { description: deleteError?.message });
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return <p className="text-on-surface-variant">Checking access…</p>;
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <Inbox className="mx-auto h-10 w-10 text-primary-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-on-surface">Staff sign-in required</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          The contact inbox is available to hospital staff and administrators.
        </p>
        <Link
          href="/login?redirect=/admin/contact-messages"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-5 font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Contact messages</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Read incoming messages and move them through the desk workflow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadList()} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counters.map((counter) => (
          <Card key={counter.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              {counter.label}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-bold text-on-surface">{counter.value}</span>
              <Badge variant={counter.tone} dot>
                {counter.label}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
          />
          <span className="pb-2 text-sm text-on-surface-variant">
            {items.length} on this page
          </span>
        </div>
      </Card>

      {error && (
        <Card className="border-danger-200 bg-danger-50 p-4 text-sm text-danger-900">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void loadList()}>
            Retry
          </button>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <p className="text-on-surface-variant">Loading messages…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">
          No messages match this filter.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-on-surface">{item.subject}</h2>
                    <Badge variant={STATUS_VARIANT[item.status] ?? 'default'} size="sm" dot>
                      {item.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {item.name} · {formatDateTime(item.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-on-surface">{item.message}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                  Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.subject ?? 'Contact message'}
        description={selected ? `From ${selected.name}` : undefined}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant px-3 text-primary-700 hover:bg-primary-50"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {selected.email}
              </a>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant px-3 text-primary-700 hover:bg-primary-50"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {selected.phone}
                </a>
              )}
            </div>

            <p className="text-xs text-on-surface-variant">
              Received {formatDateTime(selected.createdAt)} · Updated{' '}
              {formatDateTime(selected.updatedAt)}
            </p>

            <div className="rounded-xl border border-outline-variant bg-surface-low/60 p-4">
              <p className="whitespace-pre-wrap text-sm text-on-surface">{selected.message}</p>
            </div>

            <Select
              label="Move to status"
              value={selected.status}
              onChange={(event) => void updateStatus(event.target.value as ContactMessageStatus)}
              options={STATUS_OPTIONS}
              disabled={updating}
            />

            {isAdmin && (
              <Button variant="danger" onClick={() => void remove()} loading={deleting}>
                <Trash2 className="h-4 w-4" />
                Delete message
              </Button>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ScrollText, ShieldCheck } from 'lucide-react';
import { UserRole } from '@dh-araria/shared';
import { formatDateTime } from '@dh-araria/shared/utils';
import { Badge, Button, Card, Dialog, Input, Pagination } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const PAGE_SIZE = 25;

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    userId: '',
    from: '',
    to: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (filters.action.trim()) params.action = filters.action.trim();
      if (filters.resource.trim()) params.resource = filters.resource.trim();
      if (filters.userId.trim()) params.userId = filters.userId.trim();
      if (filters.from) params.from = new Date(`${filters.from}T00:00:00`).toISOString();
      if (filters.to) params.to = new Date(`${filters.to}T23:59:59.999`).toISOString();

      const response = await api.get<AuditEntry[]>('/audit-logs', params);
      setItems(handleApiResponse(response) ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (loadError: any) {
      setError(loadError?.message || 'Could not load the audit trail.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    void load();
  }, [isAuthenticated, isAdmin, load]);

  if (authLoading) {
    return <p className="text-on-surface-variant">Checking access…</p>;
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-on-surface">Administrator sign-in required</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          The audit trail is restricted to administrators.
        </p>
        <Link
          href="/login?redirect=/admin/audit-log"
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
          <h1 className="text-2xl font-bold text-on-surface">Audit trail</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Read-only CERT-In trail. Entries are written by the platform and retained for 180 days.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Action"
            value={filters.action}
            onChange={(event) => {
              setFilters((current) => ({ ...current, action: event.target.value }));
              setPage(1);
            }}
            placeholder="LOGIN_FAILED"
          />
          <Input
            label="Resource"
            value={filters.resource}
            onChange={(event) => {
              setFilters((current) => ({ ...current, resource: event.target.value }));
              setPage(1);
            }}
            placeholder="FhirBundle"
          />
          <Input
            label="User ID"
            value={filters.userId}
            onChange={(event) => {
              setFilters((current) => ({ ...current, userId: event.target.value }));
              setPage(1);
            }}
            placeholder="UUID"
          />
          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(event) => {
              setFilters((current) => ({ ...current, from: event.target.value }));
              setPage(1);
            }}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            onChange={(event) => {
              setFilters((current) => ({ ...current, to: event.target.value }));
              setPage(1);
            }}
          />
        </div>
      </Card>

      {error && (
        <Card className="border-danger-200 bg-danger-50 p-4 text-sm text-danger-900">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Retry
          </button>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <p className="text-on-surface-variant">Loading audit entries…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">
          No audit entries match these filters.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-outline-variant bg-surface-low/60">
                <tr>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">When</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Action</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Resource</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Actor</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">IP</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-low/40">
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" size="sm">
                        {entry.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-on-surface">
                      <p>{entry.resource}</p>
                      {entry.resourceId && (
                        <p className="max-w-[18rem] truncate text-xs text-on-surface-variant">
                          {entry.resourceId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      <span className="block max-w-[12rem] truncate">{entry.userId || 'System'}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{entry.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(entry)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.action ?? 'Audit entry'}
        description={selected ? `${selected.resource}${selected.resourceId ? ` · ${selected.resourceId}` : ''}` : undefined}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-on-surface-variant">When</dt>
                <dd className="text-on-surface">{formatDateTime(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-on-surface-variant">Actor</dt>
                <dd className="break-all text-on-surface">{selected.userId || 'System'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-on-surface-variant">Resource</dt>
                <dd className="break-all text-on-surface">{selected.resource}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-on-surface-variant">Resource ID</dt>
                <dd className="break-all text-on-surface">{selected.resourceId || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-on-surface-variant">IP address</dt>
                <dd className="break-all text-on-surface">{selected.ipAddress || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-on-surface-variant">Correlation ID</dt>
                <dd className="break-all text-on-surface">{selected.correlationId || '—'}</dd>
              </div>
            </dl>

            {selected.userAgent && (
              <div>
                <p className="text-xs uppercase text-on-surface-variant">User agent</p>
                <p className="mt-1 break-all text-on-surface-variant">{selected.userAgent}</p>
              </div>
            )}

            <div>
              <p className="flex items-center gap-2 text-xs uppercase text-on-surface-variant">
                <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
                Details
              </p>
              <pre className="mt-2 max-h-72 overflow-auto rounded-xl border border-outline-variant bg-surface-low/60 p-3 text-xs text-on-surface">
                {selected.details ? JSON.stringify(selected.details, null, 2) : 'No details recorded.'}
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

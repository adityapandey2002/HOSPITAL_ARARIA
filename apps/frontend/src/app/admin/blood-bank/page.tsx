'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Droplet, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Pagination, Select } from '@dh-araria/ui/components';
import { UserRole } from '@dh-araria/shared';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED', 'CANCELLED'].map(
  (value) => ({ value, label: value.replaceAll('_', ' ') })
);

const STATUS_VARIANT: Record<
  string,
  'warning' | 'primary' | 'success' | 'danger' | 'default'
> = {
  PENDING: 'warning',
  APPROVED: 'primary',
  FULFILLED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
};

interface BloodRequest {
  id: string;
  reference: string;
  patientName: string;
  requesterName: string;
  phone: string;
  email?: string | null;
  bloodGroup: string;
  componentType: string;
  units: number;
  neededBy: string;
  hospital?: string | null;
  reason?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export default function AdminBloodBankPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [items, setItems] = useState<BloodRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<BloodRequest[]>('/blood-bank/requests', params);
      setItems(handleApiResponse(response) ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (loadError: any) {
      setError(loadError?.message || 'Could not load blood requests.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    void load();
  }, [isAuthenticated, isAdmin, load]);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setActing(id);
    try {
      const updated = handleApiResponse<BloodRequest>(
        await api.put<BloodRequest>(`/blood-bank/requests/${id}/status`, { status, notes })
      );
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...updated } : item))
      );
      toast.success('Status updated');
    } catch (updateError: any) {
      toast.error('Could not update status', { description: updateError?.message });
    } finally {
      setActing(null);
    }
  };

  const act = async (request: BloodRequest, status: string) => {
    const notes = window.prompt(`Notes for ${status.toLowerCase()} (optional):`);
    if (notes === null) return;
    await updateStatus(request.id, status, notes);
  };

  if (authLoading) return <p className="text-on-surface-variant">Checking access…</p>;
  if (!isAuthenticated || !isAdmin) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-on-surface">Administrator sign-in required</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          The blood-bank queue is restricted to administrators.
        </p>
        <Link
          href="/login?redirect=/admin/blood-bank"
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
          <h1 className="text-2xl font-bold text-on-surface">Blood request queue</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage public requests. Approve what the stock can serve, then mark as fulfilled.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
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
        <p className="text-on-surface-variant">Loading requests…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">
          No blood requests match this filter.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-on-surface">{item.patientName}</p>
                    <Badge variant={STATUS_VARIANT[item.status] ?? 'default'} size="sm" dot>
                      {item.status}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {item.bloodGroup} · {item.componentType} · {item.units} unit(s)
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {item.requesterName}{item.phone ? ` · ${item.phone}` : ''}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Needed by {new Date(item.neededBy).toLocaleDateString('en-IN')}
                    {item.hospital && ` · ${item.hospital}`}
                    {item.reason && ` · ${item.reason}`}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-on-surface-variant">Notes: {item.notes}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(item, 'APPROVED')}
                    disabled={item.status !== 'PENDING' || acting === item.id}
                    loading={acting === item.id && item.status === 'PENDING'}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(item, 'FULFILLED')}
                    disabled={item.status !== 'APPROVED' || acting === item.id}
                    loading={acting === item.id && item.status === 'APPROVED'}
                  >
                    Fulfill
                  </Button>
                  {(item.status === 'PENDING' || item.status === 'APPROVED') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void act(item, 'REJECTED')}
                      loading={acting === item.id}
                      className="text-danger-600 hover:bg-danger-50"
                    >
                      Reject
                    </Button>
                  )}
                  {item.status !== 'FULFILLED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void act(item, 'CANCELLED')}
                      disabled={acting === item.id}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
    </div>
  );
}

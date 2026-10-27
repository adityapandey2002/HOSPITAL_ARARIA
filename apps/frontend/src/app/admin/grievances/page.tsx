'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

interface Grievance {
  id: string;
  referenceNumber?: string;
  name?: string;
  category?: string;
  subject?: string;
  status: string;
  createdAt?: string;
}

const STATUSES = ['SUBMITTED','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','REJECTED','CLOSED'];

export default function AdminGrievancesPage() {
  const [items, setItems] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<any>('/grievances', params);
      const data = handleApiResponse(res);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(list as Grievance[]);
    } catch {
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/grievances/${id}/status`, { status });
      toast.success('Status updated');
      await load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-on-surface">Grievances</h1>
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
      </div>
      {loading ? <p className="text-on-surface-variant">Loading…</p> : (
        <div className="space-y-3">
          {items.map((g) => (
            <Card key={g.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  {g.referenceNumber && <p className="text-xs uppercase text-on-surface-variant">Ref {g.referenceNumber}</p>}
                  <p className="font-semibold text-on-surface">{g.subject ?? g.category ?? 'Grievance'}</p>
                  {g.name && <p className="text-sm text-on-surface-variant">By {g.name}</p>}
                  {g.createdAt && <p className="text-sm text-on-surface-variant">{new Date(g.createdAt).toLocaleDateString('en-IN')}</p>}
                  <p className="text-xs font-medium text-primary-700">{g.status}</p>
                </div>
                <Select value={g.status} onChange={(e) => updateStatus(g.id, e.target.value)}
                  options={STATUSES.map((s) => ({ value: s, label: s }))} />
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="text-on-surface-variant">No grievances.</p>}
        </div>
      )}
    </div>
  );
}

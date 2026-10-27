'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  tokenNumber?: string;
  patientName?: string;
  doctorName?: string;
  departmentName?: string;
  appointmentDate: string;
  startTime: string;
  type: string;
  status: string;
}

const STATUSES = ['PENDING','CONFIRMED','COMPLETED','NO_SHOW','CANCELLED'];

export default function AdminAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<any>('/appointments', params);
      const data = handleApiResponse(res);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(list as Appointment[]);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success('Status updated');
      await load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-on-surface">Appointments</h1>
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
      </div>
      {loading ? <p className="text-on-surface-variant">Loading…</p> : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  {a.tokenNumber && <p className="text-xs uppercase text-on-surface-variant">Token {a.tokenNumber}</p>}
                  <p className="font-semibold text-on-surface">{a.patientName ?? 'Patient'} → {a.doctorName ?? 'Doctor'}</p>
                  {a.departmentName && <p className="text-sm text-on-surface-variant">{a.departmentName}</p>}
                  <p className="text-sm text-on-surface-variant">{new Date(a.appointmentDate).toLocaleDateString('en-IN')} · {a.startTime} · {a.type}</p>
                  <p className="text-xs font-medium text-primary-700">{a.status}</p>
                </div>
                <Select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}
                  options={STATUSES.map((s) => ({ value: s, label: s }))} />
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="text-on-surface-variant">No appointments.</p>}
        </div>
      )}
    </div>
  );
}

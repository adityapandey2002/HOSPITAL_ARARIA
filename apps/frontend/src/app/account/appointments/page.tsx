'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  tokenNumber?: string;
  doctorName?: string;
  departmentName?: string;
  appointmentDate: string;
  startTime: string;
  type: string;
  status: string;
  consultationFee?: number;
  reason?: string;
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/appointments');
    }
  }, [isLoading, isAuthenticated, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/appointments/my');
      const data = handleApiResponse(res);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(list as Appointment[]);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const cancel = async (id: string) => {
    if (!confirm('Cancel this appointment? The slot may be released.')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled');
      await load();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (isLoading || !isAuthenticated) {
    return <p className="p-6 text-on-surface-variant">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-on-surface">My appointments</h1>
      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="p-6">
          <p className="text-on-surface-variant">No appointments yet.</p>
          <Button className="mt-4" onClick={() => router.push('/appointments')}>
            Book an appointment
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  {a.tokenNumber && (
                    <p className="text-xs uppercase text-on-surface-variant">Token {a.tokenNumber}</p>
                  )}
                  <p className="font-semibold text-on-surface">{a.doctorName ?? 'Doctor'}</p>
                  {a.departmentName && <p className="text-sm text-on-surface-variant">{a.departmentName}</p>}
                  <p className="text-sm text-on-surface-variant">
                    {new Date(a.appointmentDate).toLocaleDateString('en-IN')} · {a.startTime} · {a.type}
                  </p>
                  {a.reason && <p className="text-sm text-on-surface-variant">Reason: {a.reason}</p>}
                  <p className="text-xs font-medium text-primary-700">{a.status}</p>
                </div>
                {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                  <Button size="sm" variant="danger" onClick={() => cancel(a.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

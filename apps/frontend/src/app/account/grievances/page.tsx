'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, ClipboardList, Eye } from 'lucide-react';
import { Card, Button, Badge } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface MyGrievance {
  id: string;
  category: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface GrievanceDetail extends MyGrievance {
  description?: string;
  complaintStatus?: string | null;
}

const STATUS_VARIANT: Record<string, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
  SUBMITTED: 'warning',
  UNDER_REVIEW: 'primary',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
  REJECTED: 'danger',
};

const PAGE_SIZE = 10;

export default function AccountGrievancesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<MyGrievance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<GrievanceDetail | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/grievances');
    }
  }, [isLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<MyGrievance[]>('/grievances/my', { limit: PAGE_SIZE });
      setItems((handleApiResponse(response) as MyGrievance[] | null) ?? []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Could not load your grievances.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  const view = async (id: string) => {
    try {
      const response = await api.get<GrievanceDetail>(`/grievances/${id}`);
      setDetail(handleApiResponse(response));
    } catch {
      toast.error('Could not open this grievance');
    }
  };

  if (isLoading || !isAuthenticated) {
    return <p className="mx-auto max-w-2xl p-6 text-on-surface-variant">Checking access…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">My grievances</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Escalations you have submitted, with their current status.
        </p>
      </div>

      {error && (
        <Card className="border-danger-200 bg-danger-50 p-4 text-sm text-danger-900">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Retry
          </button>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-primary-600" aria-hidden="true" />
          <p className="mt-4 text-on-surface-variant">No grievances yet.</p>
          <Link href="/grievances" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
            File a grievance
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" size="sm">
                      {item.category}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[item.status] ?? 'default'} size="sm" dot>
                      {item.status}
                    </Badge>
                  </p>
                  <p className="mt-1 font-semibold text-on-surface">{item.subject}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Submitted {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    {item.updatedAt &&
                      ` · Updated ${new Date(item.updatedAt).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex shrink-0 items-center gap-2"
                  onClick={() => void view(item.id)}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <Card className="p-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[detail.status] ?? 'default'} dot>
                {detail.status}
              </Badge>
              <Badge variant="outline">{detail.category}</Badge>
            </div>
            <h2 className="text-lg font-semibold text-on-surface">{detail.subject}</h2>
            {detail.description && (
              <div className="rounded-xl border border-outline-variant bg-surface-low/60 p-3">
                <p className="text-sm text-on-surface">{detail.description}</p>
              </div>
            )}
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Submitted {new Date(detail.createdAt).toLocaleString('en-IN')}</span>
              <span>{detail.updatedAt ? `Updated ${new Date(detail.updatedAt).toLocaleString('en-IN')}` : 'Not updated'}</span>
            </div>
            {detail.complaintStatus && (
              <p className="flex items-center gap-2 text-sm text-primary-700">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Feedback System Request: {detail.complaintStatus}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

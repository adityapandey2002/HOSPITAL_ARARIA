'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Link2, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

interface TrackResult {
  id: string;
  category: string;
  subject: string;
  status: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
}

function humanize(value: string) {
  return value.replace(/[A-Z]+/g, (match) => match.replace(/^([A-Z])|_?([A-Z]+)/g, '$1$2'));
}

const STATUS_VARIANT: Record<string, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
  SUBMITTED: 'warning',
  UNDER_REVIEW: 'primary',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
  REJECTED: 'danger',
};

export default function GrievanceTrackPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = id.trim();
    if (!trimmed) {
      toast.error('Enter a grievance ID');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.get<TrackResult>(`/grievances/track/${trimmed}`);
      setResult(handleApiResponse(response));
    } catch (lookupError: any) {
      const status = lookupError?.status ?? lookupError?.statusCode;
      setError(
        status === 404
          ? 'No grievance matches that ID. Check the reference in your submission email or on the form you used.'
          : lookupError?.message || 'Could not load the grievance. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatStamp = (value?: string) =>
    value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-6 w-6 text-primary-600" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Track your grievance</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Enter the grievance ID shown after you submit. You can check the status
              anytime.
            </p>
          </div>
        </div>

        <Card className="mt-6 p-6">
          <form onSubmit={(event) => void lookup(event)} className="space-y-4">
            <Input
              label="Grievance ID"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="e.g. 5f8f9e3c-8b7d-4e2a-9c1f"
              required
            />
            <div className="flex items-center gap-2">
              <Button type="submit" loading={loading} disabled={loading}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Look up
              </Button>
              {id && (
                <Button type="button" variant="outline" onClick={() => void router.refresh()}>
                  Check again
                </Button>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">
              The ID is the unique identifier we return after you submit. We do not
              need a password or account to look this up.
            </p>
          </form>
        </Card>

        {error && (
          <Card className="mt-4 border-danger-200 bg-danger-50 p-4 text-sm text-danger-900">
            {error}
          </Card>
        )}

        {result && (
          <Card className="mt-4 p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[result.status] ?? 'default'} dot>
                  {humanize(result.status)}
                </Badge>
                <Badge variant="outline">{humanize(result.category)}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-on-surface-variant">Subject</p>
                <p className="mt-1 font-semibold text-on-surface">{result.subject}</p>
              </div>

              <div className="flex flex-col gap-2 text-sm sm:flex-row">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Submitted</p>
                  <p className="text-on-surface">{formatStamp(result.createdAt)}</p>
                </div>
                {result.updatedAt && (
                  <div>
                    <p className="text-sm font-medium text-on-surface-variant">Last updated</p>
                    <p className="text-on-surface">{formatStamp(result.updatedAt)}</p>
                  </div>
                )}
                <div className="sm:flex-1">
                  <p className="text-sm font-medium text-on-surface-variant">Grievance ID</p>
                  <p className="truncate text-on-surface">{result.id}</p>
                </div>
              </div>

              {result.resolution && (
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Resolution</p>
                  <p className="text-sm text-on-surface">{result.resolution}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

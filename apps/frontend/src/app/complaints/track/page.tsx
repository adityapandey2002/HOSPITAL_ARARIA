import type { Metadata } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { cn } from '@dh-araria/shared/utils';
import { COMPLAINT_STATUS_LABELS, COMPLAINT_STATUS_COLORS } from '@dh-araria/shared/constants';
import { ComplaintStatus } from '@dh-araria/shared';

export const metadata: Metadata = {
  title: 'Track Complaint',
  description:
    'Track the status of your complaint at District Hospital Araria using your reference ID.',
};

function StatusIcon({ status, className }: { status: ComplaintStatus; className?: string }): JSX.Element {
  const IconMap: Record<ComplaintStatus, LucideIcon> = {
    [ComplaintStatus.RESOLVED]: CheckCircle,
    [ComplaintStatus.IN_PROGRESS]: Clock,
    [ComplaintStatus.REJECTED]: AlertCircle,
    [ComplaintStatus.SUBMITTED]: Info,
    [ComplaintStatus.UNDER_REVIEW]: Info,
    [ComplaintStatus.CLOSED]: Info,
  };
  const Icon = IconMap[status] ?? Info;
  return <Icon className={className} aria-hidden="true" />;
}

export default function ComplaintTrackPage() {
  const [referenceId, setReferenceId] = useState('');
  const [complaint, setComplaint] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setComplaint(null);
    setLoading(true);

    try {
      const response = await api.trackComplaint(referenceId);
      const data = handleApiResponse(response);
      setComplaint(data);
    } catch (err: any) {
      setError(
        err?.message || 'Complaint not found. Please check your reference ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-700 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Search className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Track Your Complaint</h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-primary-100">
              Enter your complaint reference ID to check its current status.
            </p>
          </div>
        </section>

        <div className="bg-white pb-12">
          <div className="container mx-auto px-4">
            <form
              onSubmit={handleSearch}
              className="max-w-lg mx-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="space-y-4">
                <Input
                  id="track-reference-id"
                  label="Complaint Reference ID"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  required
                />
                {error && (
                  <p className="text-sm text-danger-600" role="alert">
                    <AlertCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {error}
                  </p>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="w-full sm:w-auto"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Track Complaint
                  </Button>
                </div>
              </div>
            </form>

            {complaint && (
              <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Complaint #{complaint.id}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {complaint.name} &bull; {complaint.departmentName ?? 'Department not specified'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
                        COMPLAINT_STATUS_COLORS[complaint.complaintStatus] === 'success'
                          ? 'bg-success-100 text-success-800'
                          : COMPLAINT_STATUS_COLORS[complaint.complaintStatus] === 'danger'
                            ? 'bg-danger-100 text-danger-800'
                            : COMPLAINT_STATUS_COLORS[complaint.complaintStatus] === 'warning'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-primary-100 text-primary-800'
                      )}
                    >
                      <StatusIcon status={complaint.complaintStatus} className="h-4 w-4" />
                      {COMPLAINT_STATUS_LABELS[complaint.complaintStatus] ?? complaint.complaintStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Complaint Details
                  </h3>
                  <p className="mt-2 text-gray-700 whitespace-pre-line">
                    {complaint.complaint ?? complaint.description}
                  </p>
                </div>

                {complaint.resolution && (
                  <div className="mt-6 rounded-xl border border-success-200 bg-success-50 p-4">
                    <h3 className="text-sm font-semibold text-success-800 uppercase tracking-wide">
                      Resolution
                    </h3>
                    <p className="mt-2 text-gray-700 whitespace-pre-line">
                      {complaint.resolution}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid gap-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Submitted</span>
                    <span>{new Date(complaint.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span>{new Date(complaint.updatedAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/complaint"
                className="text-primary-700 font-medium hover:text-primary-800 hover:underline"
              >
                File a new complaint
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

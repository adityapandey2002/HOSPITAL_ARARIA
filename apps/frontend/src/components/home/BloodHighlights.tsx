'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Droplet, Phone } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  Section,
  Skeleton,
  SkeletonRegion,
  buttonStyles,
} from '@dh-araria/ui/components';
import { BLOOD_GROUP_LABELS, BloodGroup } from '@dh-araria/shared/types';
import { api } from '@/lib/api';
import { HOSPITAL, telHref } from '@/config/hospital';

const LOW_STOCK_THRESHOLD = 20;
const CRITICAL_STOCK_THRESHOLD = 10;

type CellStatus = 'available' | 'low' | 'critical' | 'unknown';

interface GroupCell {
  group: BloodGroup;
  label: string;
  units: number | null;
  status: CellStatus;
}

const CELL_STYLES: Record<CellStatus, string> = {
  available: 'border-success-200 bg-success-50 text-success-800',
  low: 'border-warning-200 bg-warning-50 text-warning-900',
  critical: 'border-danger-200 bg-danger-50 text-danger-800',
  unknown: 'border-outline-variant bg-card text-on-surface-variant',
};

const STATUS_LABELS: Record<CellStatus, string> = {
  available: 'In stock',
  low: 'Low',
  critical: 'Critical',
  unknown: 'Call',
};

function statusFor(units: number | null): CellStatus {
  if (units === null) return 'unknown';
  if (units <= CRITICAL_STOCK_THRESHOLD) return 'critical';
  if (units <= LOW_STOCK_THRESHOLD) return 'low';
  return 'available';
}

export function BloodHighlights() {
  const [summary, setSummary] = useState<Record<string, Record<string, number>> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await api.get<Record<string, Record<string, number>>>('/blood-bank/summary');
      setSummary(response.success ? (response.data ?? {}) : {});
      setStatus('ready');
    } catch {
      setSummary(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cells = useMemo<GroupCell[]>(
    () =>
      Object.values(BloodGroup).map((group) => {
        const components = summary?.[group];
        const units =
          components && Object.keys(components).length > 0
            ? Object.values(components).reduce((sum, value) => sum + value, 0)
            : null;
        return {
          group,
          label: BLOOD_GROUP_LABELS[group],
          units,
          status: statusFor(units),
        };
      }),
    [summary]
  );

  const hasData = cells.some((cell) => cell.units !== null);
  const criticalGroups = cells.filter((cell) => cell.status === 'critical');

  return (
    <Section
      spacing="md"
      eyebrow="Blood bank"
      title="Group-wise availability"
      description="Units recorded at the hospital blood bank. Availability is indicative — call before travelling."
      action={
        <Link
          href="/blood-bank"
          className="inline-flex min-h-9 items-center gap-1 rounded text-label text-primary-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          Open blood bank
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {status === 'loading' && (
        <SkeletonRegion
          label="Loading blood availability"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} variant="rect" className="h-24" />
          ))}
        </SkeletonRegion>
      )}

      {status === 'error' && (
        <ErrorState
          title="Blood availability could not be loaded"
          description="The inventory feed is temporarily unavailable. Call the blood bank to confirm stock."
          onRetry={() => void load()}
          fallbackHref="/blood-bank"
          fallbackLabel="Blood bank details"
        />
      )}

      {status === 'ready' && !hasData && (
        <EmptyState
          size="compact"
          icon={<Droplet className="h-5 w-5" />}
          title="Inventory not published"
          description="No stock has been recorded yet. Call the blood bank to check availability or arrange a donation."
          action={
            <a
              href={telHref(HOSPITAL.bloodBankPhone)}
              className={buttonStyles({ variant: 'outline', size: 'md' })}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call blood bank
            </a>
          }
        />
      )}

      {status === 'ready' && hasData && (
        <div className="space-y-4">
          {criticalGroups.length > 0 && (
            <p className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body-sm text-danger-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-semibold">Critical stock:</strong>{' '}
                {criticalGroups.map((cell) => cell.label).join(', ')}. Donors are urged to contact
                the blood bank.
              </span>
            </p>
          )}

          <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
            {cells.map((cell) => (
              <li
                key={cell.group}
                title={STATUS_LABELS[cell.status]}
                className={`rounded-lg border p-2 text-center sm:rounded-xl sm:p-3 ${CELL_STYLES[cell.status]}`}
              >
                <span className="block font-heading text-lg font-bold leading-none sm:text-h3">
                  {cell.label}
                </span>
                <span className="mt-1 block text-label-sm font-normal">
                  {cell.units === null ? '—' : `${cell.units} units`}
                </span>
                <span className="mt-1 block text-label-sm font-semibold">
                  {STATUS_LABELS[cell.status]}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/blood-bank/request" className={buttonStyles({ size: 'md' })}>
              Request a unit
            </Link>
            <Link
              href="/blood-bank/donate"
              className={buttonStyles({ variant: 'outline', size: 'md' })}
            >
              Donate blood
            </Link>
          </div>
        </div>
      )}
    </Section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, Stethoscope } from 'lucide-react';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Section,
  Skeleton,
  SkeletonRegion,
  buttonStyles,
} from '@dh-araria/ui/components';
import { api } from '@/lib/api';

interface ApiSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ApiDoctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  imageUrl?: string | null;
  department: { id: string; name: string };
  timeSlots?: ApiSlot[];
}

interface DoctorCard {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  fee: number;
  imageUrl?: string | null;
  department: string;
  opd: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOME_DOCTOR_COUNT = 3;

function toCard(doctor: ApiDoctor): DoctorCard {
  const slots = doctor.timeSlots ?? [];
  const days = Array.from(new Set(slots.map((slot) => DAY_LABELS[slot.dayOfWeek] ?? ''))).filter(
    Boolean
  );
  const open = slots[0];
  const opd = open && days.length > 0 ? `${days.join(', ')} · ${open.startTime}–${open.endTime}` : '';

  return {
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    qualification: doctor.qualification,
    experience: doctor.experience,
    fee: Number(doctor.consultationFee) || 0,
    imageUrl: doctor.imageUrl,
    department: doctor.department.name,
    opd,
  };
}

export function DoctorHighlights() {
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await api.get<ApiDoctor[]>('/doctors', { limit: 100 });
      const rows = response.success ? (response.data ?? []) : [];
      setDoctors(rows.map(toCard));
      setStatus('ready');
    } catch {
      setDoctors([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = doctors.slice(0, HOME_DOCTOR_COUNT);

  return (
    <Section
      tone="surface"
      spacing="md"
      eyebrow="Specialist OPD"
      title="Doctors on duty"
      description="Consultant profiles, OPD days and room details, maintained by the hospital."
      action={
        <Link
          href="/doctors"
          className="inline-flex min-h-9 items-center gap-1 rounded text-label text-primary-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          All doctors
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {status === 'loading' && (
        <SkeletonRegion label="Loading doctors" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: HOME_DOCTOR_COUNT }).map((_, index) => (
            <div key={index} className="rounded-xl border border-outline-variant bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="title" className="w-2/3" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-5" lines={2} />
              <Skeleton className="mt-5 h-10 w-full" />
            </div>
          ))}
        </SkeletonRegion>
      )}

      {status === 'error' && (
        <ErrorState
          title="Doctor profiles could not be loaded"
          description="The consultant list is temporarily unavailable. Reception can confirm today's OPD."
          onRetry={() => void load()}
          fallbackHref="/contact"
          fallbackLabel="Contact the hospital"
        />
      )}

      {status === 'ready' && visible.length === 0 && (
        <EmptyState
          icon={<Stethoscope className="h-6 w-6" />}
          title="No doctor profiles published yet"
          description="Consultant profiles are being updated. Please call reception to confirm the OPD roster."
          action={
            <Link href="/contact" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              Contact reception
            </Link>
          }
        />
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((doctor) => (
            <li key={doctor.id}>
              <article className="flex h-full flex-col rounded-xl border border-outline-variant bg-card p-5 transition-colors hover:border-primary-300 sm:p-6">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={doctor.name}
                    {...(doctor.imageUrl ? { src: doctor.imageUrl, alt: doctor.name } : {})}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h3 className="font-heading text-h3 leading-tight text-on-surface">
                      {doctor.name}
                    </h3>
                    <p className="text-label-sm font-semibold text-primary-700">
                      {doctor.specialization}
                    </p>
                    {doctor.department.toLowerCase() !== doctor.specialization.toLowerCase() && (
                      <p className="mt-0.5 truncate text-label-sm font-normal text-on-surface-variant">
                        {doctor.department}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-body-sm text-on-surface-variant">
                  {doctor.qualification}
                  {doctor.experience > 0 ? ` · ${doctor.experience} years` : ''}
                </p>

                {doctor.opd && (
                  <p className="mt-3 inline-flex items-start gap-1.5 text-label-sm text-on-surface-variant">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden="true" />
                    {doctor.opd}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                  <span className="text-label-sm text-on-surface-variant">
                    {doctor.fee > 0 ? `Fee ₹${doctor.fee}` : 'Fee at counter'}
                  </span>
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="inline-flex items-center gap-1 text-label-sm text-primary-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    View profile
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Stethoscope, Users } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  Section,
  Skeleton,
  SkeletonRegion,
  buttonStyles,
} from '@dh-araria/ui/components';
import { api } from '@/lib/api';
import {
  DEPARTMENT_PALETTE,
  DEPARTMENT_TILE_STYLES,
  departmentIcon,
} from '@/lib/department-icon';

interface ApiDepartment {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  doctorCount: number | string;
}

interface DepartmentCard {
  id: string;
  name: string;
  description: string;
  icon: ReturnType<typeof departmentIcon>;
  tile: string;
  doctors: number;
}

const HOME_DEPARTMENT_COUNT = 6;

function toCard(department: ApiDepartment, index: number): DepartmentCard {
  const color = DEPARTMENT_PALETTE[index % DEPARTMENT_PALETTE.length] ?? 'primary';
  return {
    id: department.id,
    name: department.name,
    description: department.description,
    icon: departmentIcon(department.icon || department.name),
    tile: DEPARTMENT_TILE_STYLES[color],
    doctors: Number(department.doctorCount) || 0,
  };
}

export function DepartmentHighlights() {
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await api.get<ApiDepartment[]>('/departments', { limit: 100 });
      const rows = response.success ? (response.data ?? []) : [];
      setDepartments(rows.map(toCard));
      setStatus('ready');
    } catch {
      setDepartments([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = departments.slice(0, HOME_DEPARTMENT_COUNT);

  return (
    <Section
      spacing="md"
      eyebrow="Clinical services"
      title="Departments and clinics"
      description="Specialist OPD care under one roof, from general medicine to emergency and trauma."
      action={
        <Link
          href="/services"
          className="inline-flex min-h-9 items-center gap-1 rounded text-label text-primary-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          All services
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {status === 'loading' && (
        <SkeletonRegion label="Loading departments" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: HOME_DEPARTMENT_COUNT }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-outline-variant bg-card p-5 sm:p-6"
            >
              <Skeleton variant="rect" className="mb-4 h-11 w-11" />
              <Skeleton variant="title" className="w-2/3" />
              <Skeleton className="mt-3" lines={2} />
              <Skeleton className="mt-5 h-4 w-1/3" />
            </div>
          ))}
        </SkeletonRegion>
      )}

      {status === 'error' && (
        <ErrorState
          title="Departments could not be loaded"
          description="The service directory is temporarily unavailable. You can still call the reception desk for help."
          onRetry={() => void load()}
          fallbackHref="/contact"
          fallbackLabel="Contact the hospital"
        />
      )}

      {status === 'ready' && visible.length === 0 && (
        <EmptyState
          icon={<Stethoscope className="h-6 w-6" />}
          title="No departments published yet"
          description="The hospital is updating its service directory. Please call reception for the current OPD list."
          action={
            <Link href="/contact" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              Contact reception
            </Link>
          }
        />
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {visible.map((department) => {
            const Icon = department.icon;
            return (
              <li key={department.id}>
                <Link
                  href={`/services/${department.id}`}
                  className="group flex h-full flex-col rounded-xl border border-outline-variant bg-card p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:p-5 lg:p-6"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${department.tile}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-balance font-heading text-base font-semibold leading-snug text-on-surface sm:mt-4 sm:text-h3">
                    {department.name}
                  </h3>
                  <p className="mt-1 hidden line-clamp-2 text-body-sm text-on-surface-variant sm:block">
                    {department.description}
                  </p>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-label-sm sm:pt-4">
                    <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                      <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {department.doctors > 0
                        ? `${department.doctors} ${department.doctors === 1 ? 'doctor' : 'doctors'}`
                        : 'OPD details'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary-700 group-hover:gap-2">
                      <span className="sr-only sm:not-sr-only">Details</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

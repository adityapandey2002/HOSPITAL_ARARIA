'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Baby,
  Heart,
  Bone,
  Scissors,
  Eye,
  Ear,
  Sparkles,
  Brain,
  Scan,
  Microscope,
  Droplet,
  Ambulance,
  SmilePlus,
  Activity,
  ChevronRight,
  Users,
  RefreshCw,
  Phone,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { api } from '@/lib/api';
import { HOSPITAL, telHref } from '@/config/hospital';

type DepartmentColor = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';

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
  icon: LucideIcon;
  color: DepartmentColor;
  doctors: number;
}

const PALETTE: DepartmentColor[] = ['primary', 'secondary', 'danger', 'warning', 'success'];

function iconFor(value: string): LucideIcon {
  const key = value.toLowerCase();
  if (key.includes('pediat')) return Baby;
  if (key.includes('gyne') || key.includes('obstet') || key.includes('labor')) return Heart;
  if (key.includes('ortho')) return Bone;
  if (key.includes('surg') || key.includes('ot')) return Scissors;
  if (key.includes('ophthal') || key.includes('eye')) return Eye;
  if (key.includes('dent')) return SmilePlus;
  if (key.includes('ent') || key.includes('ear')) return Ear;
  if (key.includes('derma')) return Sparkles;
  if (key.includes('psych')) return Brain;
  if (key.includes('radio')) return Scan;
  if (key.includes('path') || key.includes('lab')) return Microscope;
  if (key.includes('blood')) return Droplet;
  if (key.includes('emerg') || key.includes('icu')) return Ambulance;
  if (key.includes('physio') || key.includes('rehab')) return Activity;
  return Stethoscope;
}

const ICON_STYLES: Record<DepartmentColor, string> = {
  primary: 'bg-primary-50 text-primary-700',
  secondary: 'bg-secondary-50 text-secondary-700',
  danger: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-700',
  success: 'bg-success-50 text-success-700',
};

export function DepartmentsList() {
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await api.get<ApiDepartment[]>('/departments', { limit: 100 });
      if (!response.success) {
        setLoadError(true);
        setDepartments([]);
        return;
      }

      setDepartments(
        (response.data ?? []).map((dept, index) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          icon: iconFor(dept.icon || dept.name),
          color: PALETTE[index % PALETTE.length],
          doctors: Number(dept.doctorCount) || 0,
        }))
      );
    } catch {
      setLoadError(true);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const doctorTotal = departments.reduce((sum, dept) => sum + dept.doctors, 0);

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
              Clinical Departments
            </h2>
            <p className="text-sm text-gray-600">
              {isLoading
                ? 'Loading clinical departments…'
                : loadError
                  ? 'Live department directory is temporarily unreachable.'
                  : departments.length > 0
                    ? `${departments.length} active department${departments.length === 1 ? '' : 's'}${
                        doctorTotal > 0 ? ` · ${doctorTotal} specialist doctors` : ''
                      }`
                    : 'Clinical department schedules are maintained by the hospital.'}
            </p>
          </div>
          {loadError && (
            <button
              type="button"
              onClick={() => void fetchDepartments()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-44 animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-5"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center sm:p-8">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-primary-600" aria-hidden="true" />
            <h3 className="text-base font-semibold text-gray-900">
              Department directory could not be loaded right now
            </h3>
            <p className="mx-auto mt-1 max-w-lg text-sm text-gray-600">
              Please retry in a moment, or call the hospital reception desk for OPD room and
              department availability.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void fetchDepartments()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
              <a
                href={telHref(HOSPITAL.receptionPhone)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Phone className="h-4 w-4 text-primary-600" aria-hidden="true" />
                Reception {HOSPITAL.receptionPhone}
              </a>
            </div>
          </div>
        ) : departments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">
              No departments are published yet. Contact reception at {HOSPITAL.receptionPhone} for
              OPD schedules.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Link
                  key={dept.id}
                  href={`/services/${dept.id}`}
                  className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                >
                  <div className="mb-3.5 flex items-start justify-between">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                        ICON_STYLES[dept.color]
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    {dept.doctors > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {dept.doctors} Doctors
                      </span>
                    )}
                  </div>

                  <h3 className="mb-1.5 text-base font-bold text-gray-900 transition-colors group-hover:text-primary-700">
                    {dept.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">{dept.description}</p>

                  <div className="mt-auto border-t border-gray-100 pt-3">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 transition-all group-hover:gap-1.5">
                      View department
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

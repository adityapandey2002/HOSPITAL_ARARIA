'use client';

import { useEffect, useState } from 'react';
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
  ArrowRight,
  ChevronRight,
  Users,
  Building2,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { api } from '@/lib/api';

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
  beds: number;
}

const PALETTE: DepartmentColor[] = ['primary', 'secondary', 'danger', 'warning', 'success'];

/** Seeded rows may not carry an icon, so fall back to the department name. */
function iconFor(value: string): LucideIcon {
  const key = value.toLowerCase();
  if (key.includes('pediat')) return Baby;
  if (key.includes('gyne') || key.includes('obstet')) return Heart;
  if (key.includes('ortho')) return Bone;
  if (key.includes('surg')) return Scissors;
  if (key.includes('ophthal') || key.includes('eye')) return Eye;
  // Check dental before ENT: "dentistry" contains the substring "ent".
  if (key.includes('dent')) return SmilePlus;
  if (key.includes('ent') || key.includes('ear')) return Ear;
  if (key.includes('derma')) return Sparkles;
  if (key.includes('psych')) return Brain;
  if (key.includes('radio')) return Scan;
  if (key.includes('path') || key.includes('lab')) return Microscope;
  if (key.includes('blood')) return Droplet;
  if (key.includes('emerg')) return Ambulance;
  if (key.includes('physio') || key.includes('rehab')) return Activity;
  return Stethoscope;
}

const colorStyles = {
  primary: 'bg-primary-100 text-primary-600 border-primary-200',
  secondary: 'bg-secondary-100 text-secondary-600 border-secondary-200',
  danger: 'bg-danger-100 text-danger-600 border-danger-200',
  warning: 'bg-warning-100 text-warning-600 border-warning-200',
  success: 'bg-success-100 text-success-600 border-success-200',
};

export function DepartmentsList() {
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<ApiDepartment[]>('/departments', { limit: 100 })
      .then((response) => {
        if (cancelled || !response.success) return;

        setDepartments(
          (response.data ?? []).map((dept, index) => ({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            icon: iconFor(dept.icon || dept.name),
            color: PALETTE[index % PALETTE.length],
            doctors: Number(dept.doctorCount) || 0,
            // Bed counts are not part of the department table.
            beds: 0,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const doctorTotal = departments.reduce((sum, dept) => sum + dept.doctors, 0);

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Clinical Departments
            </h2>
            <p className="text-lg text-gray-600">
              {isLoading
                ? 'Loading departments…'
                : `${departments.length} specialized departments with ${doctorTotal}+ specialist doctors`}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((dept, index) => (
            <Link
              key={dept.id}
              href="/doctors"
              className={cn(
                'group animate-slide-up rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl',
                colorStyles[dept.color]
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                    colorStyles[dept.color].replace('border-', 'bg-')
                  )}
                >
                  <dept.icon className="h-7 w-7" />
                </div>
              </div>

              <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
                {dept.name}
              </h3>
              <p className="mb-4 line-clamp-2 text-sm text-gray-600">{dept.description}</p>

              <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                {dept.doctors > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {dept.doctors} Doctors
                  </span>
                )}
                {dept.beds > 0 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {dept.beds} Beds
                  </span>
                )}
              </div>

              <div className="border-current/20 border-t pt-4">
                <span className="inline-flex items-center gap-1 font-medium transition-all group-hover:gap-2">
                  Find Doctors
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

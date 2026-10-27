import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api, handleApiResponse } from '@/lib/api';
import { cn } from '@dh-araria/shared/utils';
import { Button } from '@dh-araria/ui/components';
import Link from 'next/link';
import {
  Stethoscope,
  Star,
  MapPin,
  Clock,
  User,
  Award,
  Mail,
  Phone,
  Calendar,
  type LucideIcon,
} from 'lucide-react';

interface DoctorDetail {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  hprId?: string | null;
  departmentId: string;
  consultationFee: number;
  rating: number;
  reviewCount: number;
  languages: string[];
  bio?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  department: {
    id: string;
    name: string;
  };
  timeSlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    maxAppointments: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface DoctorPageProps {
  params: Promise<{ id: string }>;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FALLBACK_TITLE = 'Doctor Profile | District Hospital Araria';

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await api.get<DoctorDetail>(`/doctors/${id}`);
    const record = handleApiResponse(response);

    if (record) {
      return {
        title: `Dr. ${record.name} | District Hospital Araria`,
        description: `${record.specialization} at ${record.department.name}`,
      };
    }
  } catch {
    // Fall back to the static title when the record cannot be fetched.
  }

  return { title: FALLBACK_TITLE };
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  const { id } = await params;

  let doctor: DoctorDetail | null = null;

  try {
    const response = await api.get<DoctorDetail>(`/doctors/${id}`);
    doctor = handleApiResponse(response) ?? null;
  } catch {
    // Fall through to notFound
  }

  if (!doctor || !doctor.isActive) {
    notFound();
  }

  const slots = doctor.timeSlots ?? [];
  const days = Array.from(
    new Set(slots.map((slot) => DAY_LABELS[slot.dayOfWeek] ?? '').filter(Boolean))
  );
  const startTime =
    slots.reduce((min, slot) => (slot.startTime < min ? slot.startTime : min), slots[0]?.startTime ?? '') ||
    '';
  const endTime =
    slots.reduce((max, slot) => (slot.endTime > max ? slot.endTime : max), slots[0]?.endTime ?? '') || '';

  return (
    <>
      <div>
        <section className="bg-primary-600 py-16 text-white sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Dr. {doctor.name}</h1>
            <p className="mx-auto max-w-3xl text-xl text-primary-100">
              {doctor.specialization} &bull; {doctor.department.name}
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Doctor Profile */}
              <div className="col-span-1 lg:col-span-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4'
                    )}
                  >
                    {doctor.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Dr. {doctor.name}</h2>
                  <p className="text-primary-600 font-medium">{doctor.specialization}</p>
                  <p className="text-xs text-gray-500 mt-1">{doctor.qualification}</p>
                  {doctor.hprId && (
                    <p className="text-xs text-gray-400 mt-1">HPR ID: {doctor.hprId}</p>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-warning-500" />
                    <span>{doctor.rating} / 5</span>
                    <span className="text-gray-400">({doctor.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>{doctor.experience}+ years experience</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{doctor.department.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>₹{doctor.consultationFee}/consultation</span>
                  </div>
                </div>

                {doctor.languages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {doctor.languages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Appointment Booking */}
              <div className="col-span-2 lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Book an Appointment</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Select a convenient time slot to consult with Dr. {doctor.name}.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Days</h3>
                    <div className="flex flex-wrap gap-2">
                    {days.length > 0
                      ? days.map((day) => (
                          <span
                            key={day}
                            className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700"
                          >
                            {day}
                          </span>
                        ))
                      : <span className="text-xs text-gray-500">By appointment</span>}
                  </div>
                  </div>

                  {startTime && endTime && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Timing</h3>
                      <p className="text-sm text-gray-600">
                        {startTime} - {endTime}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Bio</h3>
                    <p className="text-sm text-gray-600">
                      {doctor.bio || `Dr. ${doctor.name} is an experienced {doctor.specialization} practicing at the ${doctor.department.name} department of District Hospital Araria.`}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/appointments"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-lg font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    <Calendar className="h-4 w-4" />
                    Book Appointment with Dr. {doctor.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

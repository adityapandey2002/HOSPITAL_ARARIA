import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api, handleApiResponse } from '@/lib/api';
import { cn } from '@dh-araria/shared/utils';
import { Button } from '@dh-araria/ui/components';
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
  Users,
  Building2,
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

interface DepartmentDetail {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  doctors: Array<{
    id: string;
    name: string;
    specialization: string;
    qualification: string;
    experience: number;
    consultationFee: number;
    rating: number;
    reviewCount: number;
    imageUrl?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

function iconFor(value: string): LucideIcon {
  const key = value.toLowerCase();
  if (key.includes('pediat')) return Baby;
  if (key.includes('gyne') || key.includes('obstet')) return Heart;
  if (key.includes('ortho')) return Bone;
  if (key.includes('surg')) return Scissors;
  if (key.includes('ophthal') || key.includes('eye')) return Eye;
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

interface ServicePageProps {
  params: Promise<{ id: string }>;
}

const FALLBACK_TITLE = 'Service | District Hospital Araria';

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await api.get<DepartmentDetail>(`/departments/${id}`);
    const record = handleApiResponse(response);

    if (record) {
      return {
        title: `${record.name} | District Hospital Araria`,
        description: record.description,
      };
    }
  } catch {
    // Fall back to the static title when the record cannot be fetched.
  }

  return { title: FALLBACK_TITLE };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { id } = await params;

  let department: DepartmentDetail | null = null;

  try {
    const response = await api.get<DepartmentDetail>(`/departments/${id}`);
    department = handleApiResponse(response) ?? null;
  } catch {
    // Fall through to notFound
  }

  if (!department || !department.isActive) {
    notFound();
  }

  const Icon = iconFor(department.name);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-16 text-white sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
              <Icon className="h-8 w-8 text-primary-600 bg-white p-1" />
            </div>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">{department.name}</h1>
            <p className="mx-auto max-w-3xl text-xl text-primary-100">
              {department.description}
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Department Info Card */}
              <div className="col-span-2 lg:col-span-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600'
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{department.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {department.description}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{department.doctors.length} doctor{department.doctors.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>OPD: Monday - Saturday, 9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>+91-6453-222123</span>
                  </div>
                </div>
              </div>

              {/* Doctors in this department */}
              <div className="col-span-2 lg:col-span-2">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Doctors in {department.name}
                </h2>
                {department.doctors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
                    <p className="text-gray-500">No doctors available in this department at the moment.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {department.doctors.map((doctor) => (
                      <article
                        key={doctor.id}
                        className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-xl"
                      >
                        <div className="mb-4 flex items-start gap-4">
                          <div
                            className={cn(
                              'flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-transform group-hover:scale-110'
                            )}
                          >
                            {doctor.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                              {doctor.name}
                            </h3>
                            <p className="text-sm font-medium text-primary-600">
                              {doctor.specialization}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">{doctor.qualification}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-1 text-warning-500">
                            <span className="font-semibold">{doctor.rating}</span>
                            <span className="text-xs text-gray-400">({doctor.reviewCount})</span>
                          </div>
                        </div>

                        <div className="mb-4 space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{doctor.experience}+ years experience</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>₹{doctor.consultationFee}/consultation</span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                          <Link
                            href="/appointments"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                          >
                            Book Appointment
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

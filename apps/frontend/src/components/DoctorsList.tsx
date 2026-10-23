'use client';

import { useEffect, useState } from 'react';
import {
  Stethoscope,
  Search,
  Filter,
  ChevronDown,
  Star,
  MapPin,
  Clock,
  User,
  HeartPulse,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';
import { Avatar } from '@dh-araria/ui/components';
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
  rating: number;
  reviewCount: number;
  languages: string[];
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
  consultationFee: number;
  rating: number;
  reviewCount: number;
  languages: string[];
  imageUrl?: string | null;
  department: string;
  availableDays: string[];
  availableTime: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDoctorCard(doctor: ApiDoctor): DoctorCard {
  const slots = doctor.timeSlots ?? [];
  const days = Array.from(new Set(slots.map((slot) => DAY_LABELS[slot.dayOfWeek] ?? ''))).filter(
    Boolean
  );
  const start = slots.reduce(
    (min, slot) => (slot.startTime < min ? slot.startTime : min),
    slots[0]?.startTime ?? ''
  );
  const end = slots.reduce(
    (max, slot) => (slot.endTime > max ? slot.endTime : max),
    slots[0]?.endTime ?? ''
  );

  return {
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    qualification: doctor.qualification,
    experience: doctor.experience,
    consultationFee: Number(doctor.consultationFee),
    rating: Number(doctor.rating) || 0,
    reviewCount: doctor.reviewCount ?? 0,
    languages: doctor.languages ?? [],
    imageUrl: doctor.imageUrl,
    department: doctor.department.name,
    availableDays: days,
    availableTime: start && end ? `${start} - ${end}` : 'By appointment',
  };
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');

  useEffect(() => {
    let cancelled = false;

    api
      .get<ApiDoctor[]>('/doctors', { limit: 100 })
      .then((response) => {
        if (!cancelled && response.success) setDoctors((response.data ?? []).map(toDoctorCard));
      })
      .catch(() => {
        if (!cancelled) setDoctors([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const departments = [
    'All Departments',
    ...Array.from(new Set(doctors.map((doctor) => doctor.department))).sort(),
  ];

  const filteredDoctors = doctors
    .filter((doctor) => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment =
        selectedDepartment === 'All Departments' || doctor.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experience - a.experience;
      if (sortBy === 'fee') return a.consultationFee - b.consultationFee;
      return 0;
    });

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Search & Filters */}
        <div className="mb-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="fee">Lowest Fee</option>
            </select>
            <span className="ml-auto text-sm text-gray-500">
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Doctors Grid */}
        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">Loading doctors…</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor, index) => (
              <article
                key={doctor.id}
                className="group animate-slide-up rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-xl"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="mb-4 flex items-start gap-4">
                  <Avatar
                    name={doctor.name}
                    src={doctor.imageUrl || undefined}
                    size="xl"
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
                      {doctor.name}
                    </h3>
                    <p className="text-sm font-medium text-primary-600">{doctor.specialization}</p>
                    <p className="mt-1 text-xs text-gray-500">{doctor.qualification}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-warning-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{doctor.rating}</span>
                    <span className="text-sm text-gray-400">({doctor.reviewCount})</span>
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>{doctor.experience}+ years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{doctor.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {doctor.availableDays.length > 0
                        ? `${doctor.availableDays.join(', ')} • ${doctor.availableTime}`
                        : 'By appointment'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>₹{doctor.consultationFee}/consultation</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {doctor.languages.slice(0, 3).map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700"
                    >
                      {lang}
                    </span>
                  ))}
                  {doctor.languages.length > 3 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      +{doctor.languages.length - 3} more
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <Link
                    href="/appointments"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    <HeartPulse className="h-4 w-4" />
                    Book Appointment
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No doctors found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import {
  Stethoscope,
  Award,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  User,
  HeartPulse,
} from 'lucide-react';

const doctors = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    specialization: 'Cardiology',
    qualification: 'MD, DM (Cardiology)',
    experience: 15,
    department: 'Cardiology',
    rating: 4.9,
    reviewCount: 245,
    imageUrl: null,
    availableDays: ['Mon', 'Wed', 'Fri'],
    consultationFee: 500,
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    specialization: 'Gynecology & Obstetrics',
    qualification: 'MS (OBG), DNB',
    experience: 12,
    department: 'Obstetrics & Gynecology',
    rating: 4.8,
    reviewCount: 189,
    imageUrl: null,
    availableDays: ['Tue', 'Thu', 'Sat'],
    consultationFee: 400,
  },
  {
    id: '3',
    name: 'Dr. Amit Singh',
    specialization: 'Orthopedics',
    qualification: 'MS (Ortho), MCh',
    experience: 18,
    department: 'Orthopedics',
    rating: 4.9,
    reviewCount: 312,
    imageUrl: null,
    availableDays: ['Mon', 'Tue', 'Thu'],
    consultationFee: 600,
  },
  {
    id: '4',
    name: 'Dr. Sunita Devi',
    specialization: 'Pediatrics',
    qualification: 'MD (Pediatrics)',
    experience: 10,
    department: 'Pediatrics',
    rating: 4.7,
    reviewCount: 156,
    imageUrl: null,
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    consultationFee: 350,
  },
  {
    id: '5',
    name: 'Dr. Vikash Patel',
    specialization: 'General Surgery',
    qualification: 'MS (General Surgery)',
    experience: 14,
    department: 'General Surgery',
    rating: 4.8,
    reviewCount: 203,
    imageUrl: null,
    availableDays: ['Tue', 'Thu', 'Sat'],
    consultationFee: 450,
  },
  {
    id: '6',
    name: 'Dr. Anjali Verma',
    specialization: 'Dermatology',
    qualification: 'MD (Dermatology)',
    experience: 8,
    department: 'Dermatology',
    rating: 4.6,
    reviewCount: 98,
    imageUrl: null,
    availableDays: ['Mon', 'Fri'],
    consultationFee: 400,
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Doctors() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Our Specialist Doctors
            </h2>
            <p className="text-lg text-gray-600">
              Meet our team of highly qualified and experienced medical professionals
            </p>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            View All Doctors
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor, index) => (
            <article
              key={doctor.id}
              className="group animate-slide-up rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white',
                    getAvatarColor(doctor.name)
                  )}
                >
                  {doctor.imageUrl ? (
                    <img
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(doctor.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                        {doctor.name}
                      </h3>
                      <p className="text-sm font-medium text-blue-600">{doctor.specialization}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{doctor.rating}</span>
                      <span className="text-gray-400">({doctor.reviewCount})</span>
                    </div>
                  </div>

                  <p className="mb-3 mt-2 line-clamp-1 text-sm text-gray-500">
                    {doctor.qualification} • {doctor.experience}+ years experience
                  </p>

                  <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {doctor.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {doctor.availableDays.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="font-semibold text-gray-900">
                      ₹{doctor.consultationFee}
                      <span className="text-sm font-normal text-gray-500">/consultation</span>
                    </span>
                    <Link
                      href={`/doctors/${doctor.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      View Profile
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 px-8 py-3 text-lg font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50"
          >
            View All {doctors.length}+ Doctors
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

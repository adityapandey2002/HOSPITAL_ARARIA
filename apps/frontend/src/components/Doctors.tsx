'use client';

import Link from 'next/link';
import { 
  Stethoscope, Award, Star, MapPin, Clock, 
  ChevronRight, User, HeartPulse
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { Avatar } from '@dh-araria/ui/components';

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

export function Doctors() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Our Specialist Doctors
            </h2>
            <p className="text-lg text-gray-600">
              Meet our team of highly qualified and experienced medical professionals
            </p>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            View All Doctors
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor, index) => (
            <article
              key={doctor.id}
              className="group p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <Avatar 
                  name={doctor.name} 
                  src={doctor.imageUrl || undefined} 
                  size="xl" 
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
                    </div>
                    <div className="flex items-center gap-1 text-warning-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{doctor.rating}</span>
                      <span className="text-gray-400">({doctor.reviewCount})</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2 mb-3 line-clamp-1">
                    {doctor.qualification} • {doctor.experience}+ years experience
                  </p>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doctor.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doctor.availableDays.join(', ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="font-semibold text-gray-900">
                      ₹{doctor.consultationFee}
                      <span className="text-sm font-normal text-gray-500">/consultation</span>
                    </span>
                    <Link
                      href={`/doctors/${doctor.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                    >
                      View Profile
                      <ChevronRight className="w-4 h-4" />
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
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-primary-600 text-primary-600 text-lg font-medium rounded-xl hover:bg-primary-50 transition-all duration-200"
          >
            View All {doctors.length}+ Doctors
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
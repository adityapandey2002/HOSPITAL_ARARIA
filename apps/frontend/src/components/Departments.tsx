'use client';

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
} from 'lucide-react';

const departments = [
  {
    id: 'general-medicine',
    name: 'General Medicine',
    icon: Stethoscope,
    color: 'primary',
    description: 'Comprehensive medical care for adults',
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    icon: Baby,
    color: 'secondary',
    description: 'Child healthcare and immunization',
  },
  {
    id: 'obstetrics-gynecology',
    name: 'Obstetrics & Gynecology',
    icon: Heart,
    color: 'danger',
    description: "Women's health and maternity care",
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    icon: Bone,
    color: 'warning',
    description: 'Bone, joint, and muscle disorders',
  },
  {
    id: 'surgery',
    name: 'General Surgery',
    icon: Scissors,
    color: 'primary',
    description: 'Surgical procedures and operations',
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    icon: Eye,
    color: 'secondary',
    description: 'Eye care and vision treatment',
  },
  {
    id: 'ent',
    name: 'ENT',
    icon: Ear,
    color: 'success',
    description: 'Ear, nose, and throat disorders',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    icon: Sparkles,
    color: 'warning',
    description: 'Skin, hair, and nail conditions',
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    icon: Brain,
    color: 'secondary',
    description: 'Mental health and behavioral disorders',
  },
  {
    id: 'radiology',
    name: 'Radiology',
    icon: Scan,
    color: 'primary',
    description: 'Diagnostic imaging services',
  },
  {
    id: 'pathology',
    name: 'Pathology',
    icon: Microscope,
    color: 'danger',
    description: 'Laboratory and diagnostic testing',
  },
  {
    id: 'anesthesiology',
    name: 'Anesthesiology',
    icon: Droplet,
    color: 'secondary',
    description: 'Anesthesia and pain management',
  },
  {
    id: 'emergency',
    name: 'Emergency Medicine',
    icon: Ambulance,
    color: 'danger',
    description: '24/7 emergency and trauma care',
  },
  {
    id: 'dental',
    name: 'Dental Surgery',
    icon: SmilePlus,
    color: 'success',
    description: 'Oral health and dental procedures',
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    icon: Activity,
    color: 'warning',
    description: 'Rehabilitation and physical therapy',
  },
];

const colorStyles = {
  primary: 'bg-blue-100 text-blue-600',
  secondary: 'bg-purple-100 text-purple-600',
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-yellow-100 text-yellow-600',
  success: 'bg-green-100 text-green-600',
};

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Departments() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Our Departments</h2>
            <p className="text-lg text-gray-600">Specialized care across 15+ medical departments</p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            View All Departments
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {departments.map((dept, index) => (
            <Link
              key={dept.id}
              href={`/services/${dept.id}`}
              className={cn(
                'group rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-lg',
                'animate-slide-up'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                  colorStyles[dept.color as keyof typeof colorStyles]
                )}
              >
                <dept.icon className="h-6 w-6" />
              </div>

              <h3 className="mb-1 line-clamp-1 font-semibold text-gray-900">{dept.name}</h3>
              <p className="line-clamp-2 text-sm text-gray-500">{dept.description}</p>

              <div className="mt-4 border-t border-gray-100 pt-3">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-all group-hover:gap-2">
                  View Details
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

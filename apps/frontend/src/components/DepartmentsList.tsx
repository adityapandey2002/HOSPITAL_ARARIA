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
  Users,
  Building2,
  Clock,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';

const departments = [
  {
    id: 'general-medicine',
    name: 'General Medicine',
    icon: Stethoscope,
    color: 'primary',
    description: 'Comprehensive medical care for adults with chronic and acute conditions',
    doctors: 8,
    beds: 60,
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    icon: Baby,
    color: 'secondary',
    description: 'Child healthcare, immunization, growth monitoring, and neonatal care',
    doctors: 6,
    beds: 30,
  },
  {
    id: 'obstetrics-gynecology',
    name: 'Obstetrics & Gynecology',
    icon: Heart,
    color: 'danger',
    description:
      "Women's health, maternity care, high-risk pregnancies, and gynecological surgeries",
    doctors: 5,
    beds: 40,
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    icon: Bone,
    color: 'warning',
    description: 'Bone, joint, and muscle disorders including joint replacement and trauma',
    doctors: 4,
    beds: 25,
  },
  {
    id: 'surgery',
    name: 'General Surgery',
    icon: Scissors,
    color: 'primary',
    description: 'Surgical procedures including laparoscopic, gastrointestinal, and breast surgery',
    doctors: 4,
    beds: 20,
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    icon: Eye,
    color: 'secondary',
    description: 'Eye care, cataract surgery, glaucoma treatment, and vision correction',
    doctors: 3,
    beds: 10,
  },
  {
    id: 'ent',
    name: 'ENT',
    icon: Ear,
    color: 'success',
    description: 'Ear, nose, and throat disorders including endoscopic sinus surgery',
    doctors: 3,
    beds: 10,
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    icon: Sparkles,
    color: 'warning',
    description: 'Skin, hair, and nail conditions with laser and cosmetic procedures',
    doctors: 2,
    beds: 5,
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    icon: Brain,
    color: 'secondary',
    description: 'Mental health, de-addiction, counseling, and behavioral therapy',
    doctors: 2,
    beds: 15,
  },
  {
    id: 'radiology',
    name: 'Radiology',
    icon: Scan,
    color: 'primary',
    description: 'X-ray, ultrasound, CT scan, MRI, and interventional radiology',
    doctors: 3,
    beds: 0,
  },
  {
    id: 'pathology',
    name: 'Pathology',
    icon: Microscope,
    color: 'danger',
    description: 'Clinical pathology, biochemistry, microbiology, and blood bank',
    doctors: 4,
    beds: 0,
  },
  {
    id: 'anesthesiology',
    name: 'Anesthesiology',
    icon: Droplet,
    color: 'secondary',
    description: 'Anesthesia, pain management, and critical care support',
    doctors: 5,
    beds: 0,
  },
  {
    id: 'emergency',
    name: 'Emergency Medicine',
    icon: Ambulance,
    color: 'danger',
    description: '24/7 emergency and trauma care with resuscitation facilities',
    doctors: 6,
    beds: 20,
  },
  {
    id: 'dental',
    name: 'Dental Surgery',
    icon: SmilePlus,
    color: 'success',
    description: 'Oral health, dental implants, orthodontics, and maxillofacial surgery',
    doctors: 2,
    beds: 0,
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    icon: Activity,
    color: 'warning',
    description: 'Rehabilitation, electrotherapy, exercise therapy, and sports injury',
    doctors: 3,
    beds: 0,
  },
];

const colorStyles = {
  primary: 'bg-primary-100 text-primary-600 border-primary-200',
  secondary: 'bg-secondary-100 text-secondary-600 border-secondary-200',
  danger: 'bg-danger-100 text-danger-600 border-danger-200',
  warning: 'bg-warning-100 text-warning-600 border-warning-200',
  success: 'bg-success-100 text-success-600 border-success-200',
};

export function DepartmentsList() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Clinical Departments
            </h2>
            <p className="text-lg text-gray-600">
              {departments.length} specialized departments with{' '}
              {departments.reduce((sum, d) => sum + d.doctors, 0)}+ specialist doctors
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((dept, index) => (
            <Link
              key={dept.id}
              href={`/services/${dept.id}`}
              className={cn(
                'group animate-slide-up rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl',
                colorStyles[dept.color as keyof typeof colorStyles]
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                    colorStyles[dept.color as keyof typeof colorStyles].replace('border-', 'bg-')
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
                  View Details
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

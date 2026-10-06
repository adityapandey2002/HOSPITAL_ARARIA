'use client';

import Link from 'next/link';
import { 
  Stethoscope, Baby, Heart, Bone, Scalpel, Eye, Ear, Sparkles, Brain, 
  Scan, Microscope, Droplet, Ambulance, Tooth, Activity,
  ArrowRight, ChevronRight
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';

const departments = [
  { id: 'general-medicine', name: 'General Medicine', icon: Stethoscope, color: 'primary', description: 'Comprehensive medical care for adults' },
  { id: 'pediatrics', name: 'Pediatrics', icon: Baby, color: 'secondary', description: 'Child healthcare and immunization' },
  { id: 'obstetrics-gynecology', name: 'Obstetrics & Gynecology', icon: Heart, color: 'danger', description: 'Women\'s health and maternity care' },
  { id: 'orthopedics', name: 'Orthopedics', icon: Bone, color: 'warning', description: 'Bone, joint, and muscle disorders' },
  { id: 'surgery', name: 'General Surgery', icon: Scalpel, color: 'primary', description: 'Surgical procedures and operations' },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: Eye, color: 'secondary', description: 'Eye care and vision treatment' },
  { id: 'ent', name: 'ENT', icon: Ear, color: 'success', description: 'Ear, nose, and throat disorders' },
  { id: 'dermatology', name: 'Dermatology', icon: Sparkles, color: 'warning', description: 'Skin, hair, and nail conditions' },
  { id: 'psychiatry', name: 'Psychiatry', icon: Brain, color: 'secondary', description: 'Mental health and behavioral disorders' },
  { id: 'radiology', name: 'Radiology', icon: Scan, color: 'primary', description: 'Diagnostic imaging services' },
  { id: 'pathology', name: 'Pathology', icon: Microscope, color: 'danger', description: 'Laboratory and diagnostic testing' },
  { id: 'anesthesiology', name: 'Anesthesiology', icon: Droplet, color: 'secondary', description: 'Anesthesia and pain management' },
  { id: 'emergency', name: 'Emergency Medicine', icon: Ambulance, color: 'danger', description: '24/7 emergency and trauma care' },
  { id: 'dental', name: 'Dental Surgery', icon: Tooth, color: 'success', description: 'Oral health and dental procedures' },
  { id: 'physiotherapy', name: 'Physiotherapy', icon: Activity, color: 'warning', description: 'Rehabilitation and physical therapy' },
];

const colorStyles = {
  primary: 'bg-primary-100 text-primary-600',
  secondary: 'bg-secondary-100 text-secondary-600',
  danger: 'bg-danger-100 text-danger-600',
  warning: 'bg-warning-100 text-warning-600',
  success: 'bg-success-100 text-success-600',
};

export function Departments() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Our Departments
            </h2>
            <p className="text-lg text-gray-600">
              Specialized care across 15+ medical departments
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            View All Departments
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {departments.map((dept, index) => (
            <Link
              key={dept.id}
              href={`/services/${dept.id}`}
              className={cn(
                'group p-5 rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300',
                'animate-slide-up'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                colorStyles[dept.color as keyof typeof colorStyles]
              )}>
                <dept.icon className="w-6 h-6" />
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{dept.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{dept.description}</p>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                  View Details
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
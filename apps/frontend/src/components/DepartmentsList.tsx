'use client';

import Link from 'next/link';
import { 
  Stethoscope, Baby, Heart, Bone, Scissors, Eye, Ear, Sparkles, Brain, 
  Scan, Microscope, Droplet, Ambulance, SmilePlus, Activity,
  ArrowRight, ChevronRight, Users, Building2, Clock
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';

const departments = [
  { id: 'general-medicine', name: 'General Medicine', icon: Stethoscope, color: 'primary', description: 'Comprehensive medical care for adults with chronic and acute conditions', doctors: 8, beds: 60 },
  { id: 'pediatrics', name: 'Pediatrics', icon: Baby, color: 'secondary', description: 'Child healthcare, immunization, growth monitoring, and neonatal care', doctors: 6, beds: 30 },
  { id: 'obstetrics-gynecology', name: 'Obstetrics & Gynecology', icon: Heart, color: 'danger', description: 'Women\'s health, maternity care, high-risk pregnancies, and gynecological surgeries', doctors: 5, beds: 40 },
  { id: 'orthopedics', name: 'Orthopedics', icon: Bone, color: 'warning', description: 'Bone, joint, and muscle disorders including joint replacement and trauma', doctors: 4, beds: 25 },
  { id: 'surgery', name: 'General Surgery', icon: Scissors, color: 'primary', description: 'Surgical procedures including laparoscopic, gastrointestinal, and breast surgery', doctors: 4, beds: 20 },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: Eye, color: 'secondary', description: 'Eye care, cataract surgery, glaucoma treatment, and vision correction', doctors: 3, beds: 10 },
  { id: 'ent', name: 'ENT', icon: Ear, color: 'success', description: 'Ear, nose, and throat disorders including endoscopic sinus surgery', doctors: 3, beds: 10 },
  { id: 'dermatology', name: 'Dermatology', icon: Sparkles, color: 'warning', description: 'Skin, hair, and nail conditions with laser and cosmetic procedures', doctors: 2, beds: 5 },
  { id: 'psychiatry', name: 'Psychiatry', icon: Brain, color: 'secondary', description: 'Mental health, de-addiction, counseling, and behavioral therapy', doctors: 2, beds: 15 },
  { id: 'radiology', name: 'Radiology', icon: Scan, color: 'primary', description: 'X-ray, ultrasound, CT scan, MRI, and interventional radiology', doctors: 3, beds: 0 },
  { id: 'pathology', name: 'Pathology', icon: Microscope, color: 'danger', description: 'Clinical pathology, biochemistry, microbiology, and blood bank', doctors: 4, beds: 0 },
  { id: 'anesthesiology', name: 'Anesthesiology', icon: Droplet, color: 'secondary', description: 'Anesthesia, pain management, and critical care support', doctors: 5, beds: 0 },
  { id: 'emergency', name: 'Emergency Medicine', icon: Ambulance, color: 'danger', description: '24/7 emergency and trauma care with resuscitation facilities', doctors: 6, beds: 20 },
  { id: 'dental', name: 'Dental Surgery', icon: SmilePlus, color: 'success', description: 'Oral health, dental implants, orthodontics, and maxillofacial surgery', doctors: 2, beds: 0 },
  { id: 'physiotherapy', name: 'Physiotherapy', icon: Activity, color: 'warning', description: 'Rehabilitation, electrotherapy, exercise therapy, and sports injury', doctors: 3, beds: 0 },
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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Clinical Departments
            </h2>
            <p className="text-lg text-gray-600">
              {departments.length} specialized departments with {departments.reduce((sum, d) => sum + d.doctors, 0)}+ specialist doctors
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((dept, index) => (
            <Link
              key={dept.id}
              href={`/services/${dept.id}`}
              className={cn(
                'group p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl animate-slide-up',
                colorStyles[dept.color as keyof typeof colorStyles]
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                  colorStyles[dept.color as keyof typeof colorStyles].replace('border-', 'bg-')
                )}>
                  <dept.icon className="w-7 h-7" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {dept.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dept.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                {dept.doctors > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {dept.doctors} Doctors
                  </span>
                )}
                {dept.beds > 0 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {dept.beds} Beds
                  </span>
                )}
              </div>
              
              <div className="pt-4 border-t border-current/20">
                <span className="inline-flex items-center gap-1 font-medium group-hover:gap-2 transition-all">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
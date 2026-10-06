'use client';

import { useState } from 'react';
import { 
  Stethoscope, Search, Filter, ChevronDown, 
  Star, MapPin, Clock, User, HeartPulse, Award
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';
import { Avatar } from '@dh-araria/ui/components';

const doctors = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    specialization: 'Cardiology',
    qualification: 'MD, DM (Cardiology), FACC',
    experience: 15,
    department: 'Cardiology',
    rating: 4.9,
    reviewCount: 245,
    imageUrl: null,
    availableDays: ['Mon', 'Wed', 'Fri'],
    availableTime: '10:00 AM - 1:00 PM',
    consultationFee: 500,
    languages: ['English', 'Hindi', 'Maithili'],
    procedures: ['Angiography', 'Angioplasty', 'Pacemaker', 'Echo'],
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    specialization: 'Gynecology & Obstetrics',
    qualification: 'MS (OBG), DNB, MRCOG',
    experience: 12,
    department: 'Obstetrics & Gynecology',
    rating: 4.8,
    reviewCount: 189,
    imageUrl: null,
    availableDays: ['Tue', 'Thu', 'Sat'],
    availableTime: '10:00 AM - 1:00 PM',
    consultationFee: 400,
    languages: ['English', 'Hindi', 'Bengali'],
    procedures: ['Normal Delivery', 'C-Section', 'Hysterectomy', 'Laparoscopy'],
  },
  {
    id: '3',
    name: 'Dr. Amit Singh',
    specialization: 'Orthopedics',
    qualification: 'MS (Ortho), MCh (Joint Replacement)',
    experience: 18,
    department: 'Orthopedics',
    rating: 4.9,
    reviewCount: 312,
    imageUrl: null,
    availableDays: ['Mon', 'Tue', 'Thu'],
    availableTime: '10:00 AM - 1:00 PM',
    consultationFee: 600,
    languages: ['English', 'Hindi', 'Punjabi'],
    procedures: ['Knee Replacement', 'Hip Replacement', 'Arthroscopy', 'Trauma'],
  },
  {
    id: '4',
    name: 'Dr. Sunita Devi',
    specialization: 'Pediatrics',
    qualification: 'MD (Pediatrics), DNB',
    experience: 10,
    department: 'Pediatrics',
    rating: 4.7,
    reviewCount: 156,
    imageUrl: null,
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    availableTime: '9:00 AM - 12:00 PM',
    consultationFee: 350,
    languages: ['English', 'Hindi', 'Maithili'],
    procedures: ['Vaccination', 'Neonatal Care', 'Growth Monitoring', 'Asthma'],
  },
  {
    id: '5',
    name: 'Dr. Vikash Patel',
    specialization: 'General Surgery',
    qualification: 'MS (General Surgery), FIAGES',
    experience: 14,
    department: 'General Surgery',
    rating: 4.8,
    reviewCount: 203,
    imageUrl: null,
    availableDays: ['Tue', 'Thu', 'Sat'],
    availableTime: '10:00 AM - 1:00 PM',
    consultationFee: 450,
    languages: ['English', 'Hindi', 'Gujarati'],
    procedures: ['Laparoscopic Surgery', 'Hernia', 'Gallbladder', 'Appendix'],
  },
  {
    id: '6',
    name: 'Dr. Anjali Verma',
    specialization: 'Dermatology',
    qualification: 'MD (Dermatology), DVD',
    experience: 8,
    department: 'Dermatology',
    rating: 4.6,
    reviewCount: 98,
    imageUrl: null,
    availableDays: ['Mon', 'Fri'],
    availableTime: '11:00 AM - 2:00 PM',
    consultationFee: 400,
    languages: ['English', 'Hindi'],
    procedures: ['Laser Therapy', 'Chemical Peels', 'Acne Treatment', 'Psoriasis'],
  },
  {
    id: '7',
    name: 'Dr. Manoj Kumar',
    specialization: 'Neurology',
    qualification: 'DM (Neurology), MD (Medicine)',
    experience: 11,
    department: 'General Medicine',
    rating: 4.7,
    reviewCount: 134,
    imageUrl: null,
    availableDays: ['Tue', 'Fri'],
    availableTime: '10:00 AM - 1:00 PM',
    consultationFee: 500,
    languages: ['English', 'Hindi'],
    procedures: ['Stroke Management', 'Epilepsy', 'Migraine', 'Neuropathy'],
  },
  {
    id: '8',
    name: 'Dr. Rekha Sinha',
    specialization: 'Ophthalmology',
    qualification: 'MS (Ophthalmology), FRCS',
    experience: 16,
    department: 'Ophthalmology',
    rating: 4.8,
    reviewCount: 178,
    imageUrl: null,
    availableDays: ['Mon', 'Wed', 'Sat'],
    availableTime: '9:00 AM - 12:00 PM',
    consultationFee: 400,
    languages: ['English', 'Hindi', 'Bengali'],
    procedures: ['Cataract Surgery', 'Glaucoma', 'Retina', 'LASIK'],
  },
];

const departments = [
  'All Departments',
  'Cardiology',
  'Obstetrics & Gynecology',
  'Orthopedics',
  'Pediatrics',
  'General Surgery',
  'Dermatology',
  'General Medicine',
  'Ophthalmology',
  'Neurology',
  'ENT',
  'Psychiatry',
  'Radiology',
  'Anesthesiology',
  'Dental Surgery',
  'Physiotherapy',
];

export function DoctorsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'All Departments' || 
      doctor.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'experience') return b.experience - a.experience;
    if (sortBy === 'fee') return a.consultationFee - b.consultationFee;
    return 0;
  });

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Search & Filters */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
            
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="fee">Lowest Fee</option>
            </select>
            <span className="text-sm text-gray-500 ml-auto">
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <article
                key={doctor.id}
                className="group p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar 
                    name={doctor.name} 
                    src={doctor.imageUrl || undefined} 
                    size="xl" 
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
                    <p className="text-xs text-gray-500 mt-1">{doctor.qualification}</p>
                  </div>
                  <div className="flex items-center gap-1 text-warning-500 ml-auto">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{doctor.rating}</span>
                    <span className="text-gray-400 text-sm">({doctor.reviewCount})</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span>{doctor.experience}+ years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{doctor.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{doctor.availableDays.join(', ')} • {doctor.availableTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>₹{doctor.consultationFee}/consultation</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {doctor.languages.slice(0, 3).map((lang) => (
                    <span key={lang} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                      {lang}
                    </span>
                  ))}
                  {doctor.languages.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{doctor.languages.length - 3} more
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <HeartPulse className="w-4 h-4" />
                    Book Appointment
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </section>
  );
}
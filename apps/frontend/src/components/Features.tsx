'use client';

import { 
  Calendar, Stethoscope, Droplet, AlertCircle, 
  Shield, Truck, MessageSquare, MapPin,
  CheckCircle, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Calendar,
    title: 'Online Appointments',
    description: 'Book, reschedule, or cancel appointments with your preferred doctor from the comfort of your home. Get instant confirmation and reminders.',
    href: '/appointments',
    color: 'primary',
  },
  {
    icon: Stethoscope,
    title: 'Specialist Doctors',
    description: 'Access 50+ specialist doctors across 15+ departments. View profiles, qualifications, experience, and patient reviews.',
    href: '/doctors',
    color: 'secondary',
  },
  {
    icon: Droplet,
    title: 'Real-time Blood Bank',
    description: 'Check real-time blood availability by group and component type. Integrated with e-RaktKosh for up-to-date inventory.',
    href: '/blood-bank',
    color: 'danger',
  },
  {
    icon: AlertCircle,
    title: 'Grievance Redressal',
    description: 'File complaints and track their resolution through CPGRAMS integration. Transparent 30-day resolution timeline.',
    href: '/grievances',
    color: 'warning',
  },
  {
    icon: MessageSquare,
    title: 'Multilingual Support',
    description: 'Access the portal in 22 Indian languages through Bhashini AI integration. Voice search and text-to-speech available.',
    href: '/services',
    color: 'success',
  },
  {
    icon: MapPin,
    title: 'Location & Directions',
    description: 'Find us easily with integrated maps, ambulance services, and detailed contact information for all departments.',
    href: '/contact',
    color: 'secondary',
  },
];

const colorStyles = {
  primary: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
  secondary: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
  danger: 'bg-red-100 text-red-600 hover:bg-red-200',
  warning: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
  success: 'bg-green-100 text-green-600 hover:bg-green-200',
};

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Healthcare Services
          </h2>
          <p className="text-lg text-gray-600">
            We offer a wide range of digital healthcare services to make your experience seamless and efficient.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={cn(
                'group p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300',
                'animate-slide-up'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors',
                colorStyles[feature.color as keyof typeof colorStyles]
              )}>
                <feature.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
              
              <Link
                href={feature.href}
                className={cn(
                  'inline-flex items-center gap-2 text-sm font-medium transition-colors',
                  `text-${feature.color}-600 hover:text-${feature.color}-700`
                )}
              >
                Learn more
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>

        {/* Key Highlights */}
        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Quality Certified', desc: 'NABH accredited with STQC GIGW 3.0 compliance' },
            { icon: Truck, title: '24/7 Ambulance', desc: 'Free ambulance service with GPS tracking (Dial 102)' },
            { icon: CheckCircle, title: 'Cashless Treatment', desc: 'Ayushman Bharat & state health scheme empanelled' },
          ].map((item, index) => (
            <div
              key={item.title}
              className="p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
'use client';

import {
  Calendar,
  Stethoscope,
  Droplet,
  AlertCircle,
  Shield,
  Truck,
  MessageSquare,
  MapPin,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Calendar,
    title: 'Online Appointments',
    description:
      'Book, reschedule, or cancel appointments with your preferred doctor from the comfort of your home. Get instant confirmation and reminders.',
    href: '/appointments',
    color: 'primary',
  },
  {
    icon: Stethoscope,
    title: 'Specialist Doctors',
    description:
      'Access 50+ specialist doctors across 15+ departments. View profiles, qualifications, experience, and patient reviews.',
    href: '/doctors',
    color: 'secondary',
  },
  {
    icon: Droplet,
    title: 'Real-time Blood Bank',
    description:
      'Check real-time blood availability by group and component type. Integrated with e-RaktKosh for up-to-date inventory.',
    href: '/blood-bank',
    color: 'danger',
  },
  {
    icon: AlertCircle,
    title: 'Grievance Redressal',
    description:
      'File complaints and track their resolution through CPGRAMS integration. Transparent 30-day resolution timeline.',
    href: '/grievances',
    color: 'warning',
  },
  {
    icon: MessageSquare,
    title: 'Multilingual Support',
    description:
      'Access the portal in 22 Indian languages through Bhashini AI integration. Voice search and text-to-speech available.',
    href: '/services',
    color: 'success',
  },
  {
    icon: MapPin,
    title: 'Location & Directions',
    description:
      'Find us easily with integrated maps, ambulance services, and detailed contact information for all departments.',
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
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Comprehensive Healthcare Services
          </h2>
          <p className="text-lg text-gray-600">
            We offer a wide range of digital healthcare services to make your experience seamless
            and efficient.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={cn(
                'group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all duration-300 hover:border-blue-200 hover:shadow-lg',
                'animate-slide-up'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  'mb-6 flex h-14 w-14 items-center justify-center rounded-xl transition-colors',
                  colorStyles[feature.color as keyof typeof colorStyles]
                )}
              >
                <feature.icon className="h-7 w-7" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="mb-6 leading-relaxed text-gray-600">{feature.description}</p>

              <Link
                href={feature.href}
                className={cn(
                  'inline-flex items-center gap-2 text-sm font-medium transition-colors',
                  `text-${feature.color}-600 hover:text-${feature.color}-700`
                )}
              >
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>

        {/* Key Highlights */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Quality Certified',
              desc: 'NABH accredited with STQC GIGW 3.0 compliance',
            },
            {
              icon: Truck,
              title: '24/7 Ambulance',
              desc: 'Free ambulance service with GPS tracking (Dial 102)',
            },
            {
              icon: CheckCircle,
              title: 'Cashless Treatment',
              desc: 'Ayushman Bharat & state health scheme empanelled',
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="animate-slide-up rounded-2xl border border-gray-100 bg-gray-50 p-6"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

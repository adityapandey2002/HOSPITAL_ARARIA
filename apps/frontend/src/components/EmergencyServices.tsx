'use client';

import {
  Ambulance,
  Phone,
  MapPin,
  Clock,
  Heart,
  Shield,
  Truck,
  UserCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';

const emergencyServices = [
  {
    icon: Ambulance,
    title: '24/7 Ambulance Service',
    description:
      'Free ambulance service with GPS tracking and trained paramedics. Dial 102 for immediate dispatch.',
    features: [
      'GPS-enabled ambulances',
      'Trained paramedics',
      'Basic life support',
      'Free for BPL patients',
    ],
    cta: 'Call 102',
    href: 'tel:102',
    color: 'primary',
  },
  {
    icon: Heart,
    title: 'Emergency Department',
    description:
      'Fully equipped 20-bed emergency department with resuscitation bay, triage, and observation units.',
    features: [
      '24/7 specialist on-call',
      'Trauma resuscitation',
      'Poisoning management',
      'Cardiac emergency care',
    ],
    cta: 'Visit Emergency',
    href: '/services?q=Emergency',
    color: 'danger',
  },
  {
    icon: Shield,
    title: 'Trauma Care',
    description:
      'Designated trauma center with orthopedic, neurosurgical, and general surgical backup round the clock.',
    features: ['Trauma team activation', 'CT scan on-site', 'Blood bank access', 'ICU backup'],
    cta: 'Learn More',
    href: '/services?q=Emergency',
    color: 'warning',
  },
  {
    icon: AlertTriangle,
    title: 'Disaster Management',
    description:
      'Hospital disaster management plan with mass casualty protocols and coordination with district administration.',
    features: [
      'Mass casualty plan',
      'Decontamination unit',
      'Triage protocols',
      'District coordination',
    ],
    cta: 'View Plan',
    href: '/services?q=Emergency',
    color: 'secondary',
  },
];

const colorStyles = {
  primary: 'bg-primary-100 text-primary-600 border-primary-200',
  danger: 'bg-danger-100 text-danger-600 border-danger-200',
  warning: 'bg-warning-100 text-warning-600 border-warning-200',
  secondary: 'bg-secondary-100 text-secondary-600 border-secondary-200',
};

export function EmergencyServices() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-danger-100 px-4 py-2 text-sm font-medium text-danger-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Emergency Services Available 24/7</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Emergency & Critical Care
          </h2>
          <p className="text-lg text-gray-600">
            Immediate medical attention when every second counts. Our emergency department is
            staffed round the clock with specialists on call.
          </p>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {emergencyServices.map((service, index) => (
            <article
              key={service.title}
              className={cn(
                'animate-slide-up rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl',
                colorStyles[service.color as keyof typeof colorStyles]
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                  colorStyles[service.color as keyof typeof colorStyles].replace('border-', 'bg-')
                )}
              >
                <service.icon className="h-6 w-6" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">{service.title}</h3>
              <p className="mb-4 text-sm text-gray-600">{service.description}</p>

              <ul className="mb-4 space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={service.href}
                className={cn(
                  'inline-flex items-center gap-1 font-medium transition-colors',
                  colorStyles[service.color as keyof typeof colorStyles]
                    .replace('border-', 'text-')
                    .replace('bg-', 'hover:bg-')
                    .replace('text-', 'hover:text-')
                )}
              >
                {service.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>

        {/* Emergency Contact Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-danger-600 to-danger-700 p-6 text-white md:p-8">
          <div className="grid gap-6 text-center md:grid-cols-4">
            <div>
              <Phone className="mx-auto mb-3 h-10 w-10 text-white/80" />
              <p className="mb-1 text-sm text-white/70">Ambulance</p>
              <a
                href="tel:102"
                className="text-2xl font-bold transition-colors hover:text-yellow-200"
              >
                102
              </a>
            </div>
            <div>
              <Phone className="mx-auto mb-3 h-10 w-10 text-white/80" />
              <p className="mb-1 text-sm text-white/70">National Emergency</p>
              <a
                href="tel:108"
                className="text-2xl font-bold transition-colors hover:text-yellow-200"
              >
                108
              </a>
            </div>
            <div>
              <Phone className="mx-auto mb-3 h-10 w-10 text-white/80" />
              <p className="mb-1 text-sm text-white/70">Hospital Emergency</p>
              <a
                href="tel:+91-6453-222100"
                className="text-lg font-bold transition-colors hover:text-yellow-200"
              >
                +91-6453-222100
              </a>
            </div>
            <div>
              <MapPin className="mx-auto mb-3 h-10 w-10 text-white/80" />
              <p className="mb-1 text-sm text-white/70">Location</p>
              <p className="font-medium">
                District Hospital Araria
                <br />
                Near Collectorate, Araria
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-danger-600 transition-colors hover:bg-white/90"
            >
              Get Directions
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import {
  Ambulance,
  Phone,
  MapPin,
  Heart,
  Shield,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';

type ServiceTone = 'primary' | 'danger' | 'warning' | 'secondary';

const emergencyServices: Array<{
  icon: typeof Ambulance;
  title: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  tone: ServiceTone;
}> = [
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
    tone: 'primary',
  },
  {
    icon: Heart,
    title: 'Emergency Department',
    description:
      'Equipped emergency ward with resuscitation bay, triage desk, and continuous observation beds.',
    features: [
      '24/7 specialist on-call',
      'Trauma resuscitation',
      'Poisoning management',
      'Cardiac emergency care',
    ],
    cta: 'Contact Emergency',
    href: '/contact',
    tone: 'danger',
  },
  {
    icon: Shield,
    title: 'Trauma Care',
    description:
      'Designated district trauma center with orthopedic, surgical, and critical care backup round the clock.',
    features: ['Trauma team activation', 'On-site diagnostics', 'Blood bank access', 'ICU backup'],
    cta: 'Check Blood Bank',
    href: '/blood-bank',
    tone: 'warning',
  },
  {
    icon: AlertTriangle,
    title: 'Disaster Management',
    description:
      'Hospital disaster readiness plan with mass casualty protocols and district administration coordination.',
    features: [
      'Mass casualty plan',
      'Decontamination unit',
      'Triage protocols',
      'District coordination',
    ],
    cta: 'View Helplines',
    href: '/contact',
    tone: 'secondary',
  },
];

const TOP_ACCENT: Record<ServiceTone, string> = {
  primary: 'border-t-primary-600',
  danger: 'border-t-danger-600',
  warning: 'border-t-warning-500',
  secondary: 'border-t-secondary-600',
};

const ICON_BADGE: Record<ServiceTone, string> = {
  primary: 'bg-primary-50 text-primary-700',
  danger: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-700',
  secondary: 'bg-secondary-50 text-secondary-700',
};

const LINK_TONE: Record<ServiceTone, string> = {
  primary: 'text-primary-700 hover:text-primary-800',
  danger: 'text-danger-700 hover:text-danger-800',
  warning: 'text-warning-700 hover:text-warning-800',
  secondary: 'text-secondary-700 hover:text-secondary-800',
};

export function EmergencyServices() {
  return (
    <section className="border-t border-outline-variant bg-surface py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-danger-700">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Emergency Services Available 24×7
          </p>
          <h2 className="font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            Emergency &amp; Critical Care
          </h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Immediate medical attention when every second counts. Our emergency department is
            staffed round the clock with specialists on call.
          </p>
        </div>

        <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {emergencyServices.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className={cn(
                  'flex flex-col rounded-xl border border-gray-200 border-t-[3px] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                  TOP_ACCENT[service.tone]
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-10 w-10 items-center justify-center rounded-lg',
                    ICON_BADGE[service.tone]
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <h3 className="mb-1.5 text-base font-bold text-gray-900">{service.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">{service.description}</p>

                <ul className="mb-5 space-y-1.5 text-xs text-gray-600">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-gray-100 pt-3">
                  <a
                    href={service.href}
                    className={cn(
                      'inline-flex items-center gap-1 text-sm font-semibold transition-colors',
                      LINK_TONE[service.tone]
                    )}
                  >
                    {service.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {/* Emergency Contact Bar */}
        <div className="rounded-xl border border-primary-900 bg-primary-950 p-6 text-white md:p-7">
          <div className="grid gap-6 text-center md:grid-cols-4">
            <div>
              <Phone className="mx-auto mb-2 h-6 w-6 text-primary-300" aria-hidden="true" />
              <p className="mb-0.5 text-xs uppercase tracking-wider text-white/65">Ambulance</p>
              <a
                href="tel:102"
                className="text-2xl font-bold tabular-nums text-white transition-colors hover:text-primary-200"
              >
                102
              </a>
            </div>
            <div>
              <Phone className="mx-auto mb-2 h-6 w-6 text-danger-400" aria-hidden="true" />
              <p className="mb-0.5 text-xs uppercase tracking-wider text-white/65">National Emergency</p>
              <a
                href="tel:108"
                className="text-2xl font-bold tabular-nums text-white transition-colors hover:text-danger-200"
              >
                108
              </a>
            </div>
            <div>
              <Phone className="mx-auto mb-2 h-6 w-6 text-primary-300" aria-hidden="true" />
              <p className="mb-0.5 text-xs uppercase tracking-wider text-white/65">Hospital Emergency</p>
              <a
                href="tel:+916453222100"
                className="text-lg font-bold tabular-nums text-white transition-colors hover:text-primary-200"
              >
                +91-6453-222100
              </a>
            </div>
            <div>
              <MapPin className="mx-auto mb-2 h-6 w-6 text-primary-300" aria-hidden="true" />
              <p className="mb-0.5 text-xs uppercase tracking-wider text-white/65">Location</p>
              <p className="text-sm font-medium text-white/90">
                District Hospital Araria
                <br />
                Near Collectorate, Araria
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-50"
            >
              Get Directions &amp; Helplines
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  MapPin,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { Container, buttonStyles } from '@dh-araria/ui/components';
import { HomeSlideshow } from '@/components/home/HomeSlideshow';
import { HOSPITAL, telHref } from '@/config/hospital';

const HERO_FACTS = [
  {
    icon: Siren,
    label: '24×7 Emergency',
    value: 'Trauma & Dial 108',
    href: telHref('108'),
  },
  {
    icon: Clock,
    label: 'OPD Clinics',
    value: 'Mon–Sat · 9 AM–4 PM',
    href: '/services',
  },
  {
    icon: MapPin,
    label: 'Hospital Campus',
    value: `Near Collectorate, ${HOSPITAL.address.city}`,
    href: '/contact',
  },
];

/**
 * Home hero. Pairs concise hospital overview + hospital-at-a-glance strip
 * with the curated campus visual / admin-managed slideshow on the right.
 */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-b from-primary-50/75 via-surface to-surface">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary-100/40 blur-3xl"
        aria-hidden="true"
      />

      <Container
        size="wide"
        className="relative grid gap-6 py-4 sm:py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 xl:gap-14 lg:py-8"
      >
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-card px-2.5 py-0.5 text-xs font-medium text-primary-800">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Government of Bihar · Department of Health
          </p>

          <h1 className="mt-2.5 text-balance font-heading text-[clamp(1.65rem,3vw,2.6rem)] font-bold leading-[1.12] tracking-tight text-on-surface">
            District Hospital <span className="text-primary-700">Araria</span>
          </h1>

          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Book an OPD appointment, find specialist doctors, check live district blood
            availability, or raise a complaint — all public healthcare services in one place.
          </p>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/appointments"
              className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}
            >
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              Book appointment
            </Link>
            <Link
              href="/doctors"
              className={buttonStyles({ variant: 'outline', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              Find a doctor
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>

          {/* Hospital-at-a-glance strip */}
          <dl className="mt-5 grid grid-cols-1 gap-2 border-t border-outline-variant/80 pt-4 sm:grid-cols-3 sm:gap-2.5">
            {HERO_FACTS.map((fact) => {
              const Icon = fact.icon;
              return (
                <Link
                  key={fact.label}
                  href={fact.href}
                  className="group flex items-start gap-2 rounded-lg border border-outline-variant/70 bg-card/90 px-2.5 py-2.5 transition-colors hover:border-primary-300 hover:bg-card"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold leading-tight text-on-surface">{fact.label}</dt>
                    <dd className="mt-0.5 text-[0.72rem] leading-snug text-on-surface-variant">{fact.value}</dd>
                  </div>
                </Link>
              );
            })}
          </dl>
        </div>

        <HomeSlideshow />
      </Container>
    </section>
  );
}

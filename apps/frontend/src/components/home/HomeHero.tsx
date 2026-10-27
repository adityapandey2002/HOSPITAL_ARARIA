import Link from 'next/link';
import { ArrowRight, CalendarCheck, Phone, ShieldCheck, Siren } from 'lucide-react';
import { Container, buttonStyles } from '@dh-araria/ui/components';
import { MediaFrame } from '@/components/layout/MediaFrame';
import { HOSPITAL, telHref } from '@/config/hospital';

/**
 * Home hero. The right-hand slot is a `MediaFrame`: it shows the branded
 * identity panel until the hospital supplies a photograph.
 */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-b from-primary-50 via-surface to-surface">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary-100/50 blur-3xl"
        aria-hidden="true"
      />

      <Container
        size="wide"
        className="relative grid gap-8 py-8 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-16"
      >
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-card px-3 py-1 text-label-sm text-primary-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Government of Bihar · Department of Health
          </p>

          <h1 className="mt-4 text-balance font-heading text-[clamp(2rem,7vw,3.25rem)] leading-[1.08] tracking-tight text-on-surface">
            District Hospital <span className="text-primary-700">Araria</span>
          </h1>

          <p className="mt-4 max-w-xl text-body-lg text-on-surface-variant">
            Book an OPD appointment, find the right specialist, check blood availability or raise a
            complaint — the district hospital&apos;s services in one place.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

          <dl className="mt-7 grid gap-x-6 gap-y-4 border-t border-outline-variant pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                  Reception
                </dt>
                <dd className="text-label">
                  <a
                    href={telHref(HOSPITAL.receptionPhone)}
                    className="rounded text-on-surface underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    {HOSPITAL.receptionPhone}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Siren className="mt-0.5 h-4 w-4 shrink-0 text-emergency" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                  Emergency
                </dt>
                <dd className="flex flex-wrap gap-x-2 text-label">
                  {HOSPITAL.emergencyNumbers.map((entry, index) => (
                    <span key={entry.number} className="inline-flex items-center gap-2">
                      {index > 0 && <span className="text-outline" aria-hidden="true">·</span>}
                      <a
                        href={telHref(entry.number)}
                        className="rounded text-emergency underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emergency"
                      >
                        {entry.label} {entry.number}
                      </a>
                    </span>
                  ))}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <MediaFrame priority className="w-full max-w-xl lg:justify-self-end" />
      </Container>
    </section>
  );
}

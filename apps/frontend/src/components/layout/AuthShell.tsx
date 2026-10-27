import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarCheck, MessageSquare, ShieldCheck, Siren } from 'lucide-react';
import { Container } from '@dh-araria/ui/components';
import { HOSPITAL, telHref } from '@/config/hospital';

const BENEFITS = [
  {
    icon: CalendarCheck,
    title: 'Track your appointments',
    body: 'See booked OPD slots and the token issued for your visit.',
  },
  {
    icon: MessageSquare,
    title: 'Follow your complaint',
    body: 'Keep every update and the final reply against one reference number.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'Your details are visible only to you and the desk handling your request.',
  },
];

/**
 * Shared shell for sign in, registration and password help. The left panel is
 * decorative and hidden below `lg`, so phones get the form immediately.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary-900 p-10 text-white lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-700/60 blur-2xl"
        />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path
                  d="M12 3.5 4.5 7v5.2c0 4.3 3 7.4 7.5 8.3 4.5-.9 7.5-4 7.5-8.3V7L12 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M12 8.2v6.4M8.8 11.4h6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span>
              <span className="block font-heading text-lg font-bold leading-tight">{HOSPITAL.name}</span>
              <span className="block text-label-sm text-white/70">{HOSPITAL.authority}</span>
            </span>
          </Link>

          <h2 className="mt-12 max-w-sm text-balance font-heading text-3xl font-bold leading-tight">
            One account for every hospital service.
          </h2>

          <ul className="mt-8 space-y-5">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <benefit.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-label text-white">{benefit.title}</span>
                  <span className="mt-0.5 block text-body-sm text-white/70">{benefit.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-label-sm uppercase tracking-wider text-white/60">Need help now?</p>
          <a
            href={telHref(HOSPITAL.emergencyNumbers[1]?.number ?? '108')}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emergency px-4 py-2 text-label text-white transition-colors hover:bg-emergency-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            Emergency 108
          </a>
        </div>
      </aside>

      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:px-10 lg:py-12">
        <Container size="content" className="w-full px-0 sm:px-0 lg:px-0">
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg text-label text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to portal
            </Link>
            <span className="text-label-sm text-on-surface-variant">{HOSPITAL.shortName}</span>
          </div>
          <div className="w-full max-w-md">{children}</div>
        </Container>
      </main>
    </div>
  );
}

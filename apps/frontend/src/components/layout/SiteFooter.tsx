import Link from 'next/link';
import { Mail, MapPin, Phone, Siren } from 'lucide-react';
import { Container } from '@dh-araria/ui/components';
import { FOOTER_GROUPS } from '@/config/navigation';
import { HOSPITAL, formatAddress, telHref } from '@/config/hospital';

const linkClass =
  'rounded text-body-sm text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary-950 text-white/80">
      <Container size="wide" className="pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] pt-12 lg:pb-8">
        <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" aria-hidden="true">
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
                <span className="block font-heading text-base font-bold text-white">{HOSPITAL.name}</span>
                <span className="block text-label-sm text-white/70">{HOSPITAL.authority}</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-white/70">
              Official portal of the district hospital, published by the {HOSPITAL.department}.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-label-sm uppercase tracking-wider text-white/60">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}`}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="text-label-sm uppercase tracking-wider text-white/60">Visit us</h2>
            <address className="mt-3 space-y-2 text-body-sm not-italic text-white/80">
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                <span>{formatAddress()}</span>
              </span>
              {HOSPITAL.mapsUrl && (
                <a href={HOSPITAL.mapsUrl} className={linkClass}>
                  Open in maps
                </a>
              )}
            </address>
          </div>

          <div>
            <h2 className="text-label-sm uppercase tracking-wider text-white/60">Talk to us</h2>
            <ul className="mt-3 space-y-2 text-body-sm">
              <li>
                <a href={telHref(HOSPITAL.receptionPhone)} className={`inline-flex items-center gap-2 ${linkClass}`}>
                  <Phone className="h-4 w-4 text-white/60" aria-hidden="true" />
                  Reception {HOSPITAL.receptionPhone}
                </a>
              </li>
              <li>
                <a href={telHref(HOSPITAL.bloodBankPhone)} className={`inline-flex items-center gap-2 ${linkClass}`}>
                  <Phone className="h-4 w-4 text-white/60" aria-hidden="true" />
                  Blood bank {HOSPITAL.bloodBankPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${HOSPITAL.email}`} className={`inline-flex items-center gap-2 ${linkClass}`}>
                  <Mail className="h-4 w-4 text-white/60" aria-hidden="true" />
                  {HOSPITAL.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-label-sm uppercase tracking-wider text-white/60">Emergency</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {HOSPITAL.emergencyNumbers.map((entry) => (
                <a
                  key={entry.number}
                  href={telHref(entry.number)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emergency px-4 py-2 text-label text-white transition-colors hover:bg-emergency-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
                >
                  <Siren className="h-4 w-4" aria-hidden="true" />
                  {entry.label} {entry.number}
                </a>
              ))}
            </div>
            {HOSPITAL.opdHours && <p className="mt-3 text-body-sm text-white/70">OPD: {HOSPITAL.opdHours}</p>}
            <p className="mt-2 text-body-sm text-white/70">Emergency care is available 24 hours.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-white/60">
            © {year} {HOSPITAL.name}. Content published by the {HOSPITAL.department}.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm">
            <Link href="/privacy" className={linkClass}>
              Privacy
            </Link>
            <Link href="/terms" className={linkClass}>
              Terms
            </Link>
            <Link href="/accessibility" className={linkClass}>
              Accessibility
            </Link>
            <Link href="/sitemap" className={linkClass}>
              Sitemap
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

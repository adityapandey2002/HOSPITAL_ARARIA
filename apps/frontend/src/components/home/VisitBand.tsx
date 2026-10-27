import { Mail, MapPin, Phone, Siren } from 'lucide-react';
import { Section } from '@dh-araria/ui/components';
import { HOSPITAL, formatAddress, mapSearchHref, telHref } from '@/config/hospital';

const linkClass =
  'inline-flex min-h-9 items-center gap-1.5 rounded text-label underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700';

export function VisitBand() {
  return (
    <Section
      tone="brand"
      spacing="md"
      eyebrow="Visiting the hospital"
      title="How to reach us"
      description="The hospital is in Araria town, near the District Collectorate. Call ahead if you are travelling from another block."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/15 bg-white/10 p-5">
          <MapPin className="h-5 w-5 text-white/80" aria-hidden="true" />
          <h3 className="mt-3 font-heading text-h3 text-white">Address</h3>
          <address className="mt-2 text-body-sm not-italic text-white/85">{formatAddress()}</address>
          <a
            href={mapSearchHref()}
            target="_blank"
            rel="noreferrer"
            className={`mt-3 ${linkClass}`}
          >
            Search on Google Maps
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/10 p-5">
          <Phone className="h-5 w-5 text-white/80" aria-hidden="true" />
          <h3 className="mt-3 font-heading text-h3 text-white">Reception desk</h3>
          <p className="mt-2 text-body-sm text-white/85">
            For OPD schedules, documents and general help.
          </p>
          <a href={telHref(HOSPITAL.receptionPhone)} className={`mt-3 ${linkClass}`}>
            {HOSPITAL.receptionPhone}
          </a>
          <a href={`mailto:${HOSPITAL.email}`} className={`mt-1 flex ${linkClass}`}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            {HOSPITAL.email}
          </a>
        </div>

        <div className="rounded-xl border border-danger-300/60 bg-danger-900/30 p-5">
          <Siren className="h-5 w-5 text-white" aria-hidden="true" />
          <h3 className="mt-3 font-heading text-h3 text-white">Emergency</h3>
          <p className="mt-2 text-body-sm text-white/85">
            Emergency care is available round the clock. Call before you leave if you can.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HOSPITAL.emergencyNumbers.map((entry) => (
              <a
                key={entry.number}
                href={telHref(entry.number)}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emergency px-3 py-1.5 text-label text-white transition-colors hover:bg-emergency-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {entry.label} {entry.number}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

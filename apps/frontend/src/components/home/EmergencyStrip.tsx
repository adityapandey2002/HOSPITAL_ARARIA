import { Siren } from 'lucide-react';
import { Container } from '@dh-araria/ui/components';
import { HOSPITAL, telHref } from '@/config/hospital';

/**
 * Slim emergency band under the header on small screens. Desktop already
 * carries the same numbers in the utility bar, so it is hidden from `lg`.
 */
export function EmergencyStrip() {
  return (
    <div className="bg-emergency text-white lg:hidden">
      <Container size="wide" className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-label-sm font-bold uppercase tracking-wide">
          <Siren className="h-4 w-4" aria-hidden="true" />
          Emergency
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label-sm">
          {HOSPITAL.emergencyNumbers.map((entry) => (
            <a
              key={entry.number}
              href={telHref(entry.number)}
              className="rounded underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {entry.label} {entry.number}
            </a>
          ))}
        </div>
      </Container>
    </div>
  );
}

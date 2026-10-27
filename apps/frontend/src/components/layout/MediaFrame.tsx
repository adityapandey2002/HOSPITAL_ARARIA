import Image from 'next/image';
import type { ReactNode } from 'react';
import { Hospital, MapPin, Phone, Siren } from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { HOSPITAL, shortAddress, telHref } from '@/config/hospital';

export type MediaFrameAspect = 'photo' | 'video' | 'wide' | 'square';

export interface MediaFrameProps {
  /**
   * Local path under `public/`. When omitted the frame renders the branded
   * identity panel instead, so an unpublished photograph never leaves a broken
   * or empty hole in the layout.
   */
  src?: string | null;
  alt?: string;
  aspect?: MediaFrameAspect;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Extra chips drawn along the bottom edge of the frame. */
  children?: ReactNode;
}

const ASPECTS: Record<MediaFrameAspect, string> = {
  photo: 'aspect-[4/3]',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
  square: 'aspect-square',
};

/**
 * The single image slot used across the public site.
 *
 * Photographs are added by dropping a file into `apps/frontend/public/media/`
 * and passing its path here. Until then the gradient panel keeps the slot's
 * height and carries verified facility facts only — no stock imagery, no
 * accreditation badges.
 */
export function MediaFrame({
  src,
  alt = '',
  aspect = 'photo',
  priority,
  sizes = '(min-width: 1024px) 45vw, 100vw',
  className,
  children,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-xl bg-primary-800 shadow-lg',
        ASPECTS[aspect],
        className
      )}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-950/10 to-transparent"
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-5 sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.16)_1px,transparent_0)] bg-[length:22px_22px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/15"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-white/10"
            aria-hidden="true"
          />

          <span className="relative inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-label-sm text-white">
            <Hospital className="h-3.5 w-3.5" aria-hidden="true" />
            District hospital
          </span>

          <div className="relative">
            <p className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
              {HOSPITAL.name}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-body-sm text-white/80">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {shortAddress()}
            </p>
          </div>

          <div className="relative flex flex-wrap gap-2">
            <a
              href={telHref('108')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-emergency px-3 py-1.5 text-label-sm text-white transition-colors hover:bg-emergency-dark"
            >
              <Siren className="h-3.5 w-3.5" aria-hidden="true" />
              Emergency 108
            </a>
            <a
              href={telHref(HOSPITAL.receptionPhone)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-label-sm text-white transition-colors hover:bg-white/20"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              Reception
            </a>
          </div>
        </div>
      )}

      {children && <div className="absolute inset-x-0 bottom-0 p-4">{children}</div>}
    </div>
  );
}

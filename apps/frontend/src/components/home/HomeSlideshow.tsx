'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';
import { api, handleApiResponse } from '@/lib/api';
import { HOSPITAL, shortAddress, telHref } from '@/config/hospital';

interface Slide {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
}

function DefaultCampusVisual() {
  return (
    <div className="relative aspect-[16/10] max-h-[460px] w-full overflow-hidden rounded-2xl border border-outline-variant bg-primary-950 shadow-md">
      <Image
        src="/media/hospital-hero.jpg"
        alt="District Hospital Araria outpatient building and landscaped courtyard"
        fill
        priority
        sizes="(min-width: 1024px) 48vw, 100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-950/85 via-primary-950/15 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-primary-200">
            Outpatient &amp; Emergency Block
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-white">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-200" aria-hidden="true" />
            <span className="truncate">
              {HOSPITAL.address.line2}, {shortAddress()}
            </span>
          </p>
        </div>

        {/* Shown on sm+ only so mobile does not duplicate the top EmergencyStrip */}
        <a
          href={telHref(HOSPITAL.receptionPhone)}
          className="hidden items-center gap-1.5 rounded-lg border border-white/25 bg-primary-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-primary-900 sm:inline-flex"
        >
          <Phone className="h-3.5 w-3.5 text-primary-200" aria-hidden="true" />
          Reception desk
        </a>
      </div>
    </div>
  );
}

export function HomeSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Slide[]>('/slideshow');
        const data = handleApiResponse(res) ?? [];
        if (!cancelled && Array.isArray(data)) setSlides(data);
      } catch {
        // Fall back to curated campus photograph
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!loaded || slides.length === 0) {
    return <DefaultCampusVisual />;
  }

  const slide = slides[index];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-outline-variant bg-primary-950 shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.url}
        alt={slide.alt || 'District Hospital Araria campus'}
        className="aspect-[16/10] max-h-[460px] w-full object-cover"
      />
      {slide.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-950/85 to-transparent px-4 pb-3 pt-8 text-sm text-white">
          {slide.caption}
        </div>
      )}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/45'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

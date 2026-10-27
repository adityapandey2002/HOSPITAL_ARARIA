'use client';

import { useEffect, useState } from 'react';
import { MediaFrame } from '@/components/layout/MediaFrame';
import { api, handleApiResponse } from '@/lib/api';

interface Slide {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
}

export function HomeSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any[]>('/slideshow');
        const data = handleApiResponse(res) ?? [];
        if (!cancelled) setSlides(data as Slide[]);
      } catch {
        // fall back to branded frame
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

  if (!loaded) {
    return <MediaFrame priority className="w-full max-w-xl lg:justify-self-end" />;
  }

  if (slides.length === 0) {
    return <MediaFrame priority className="w-full max-w-xl lg:justify-self-end" />;
  }

  const slide = slides[index];

  return (
    <div className="relative w-full max-w-xl overflow-hidden rounded-2xl lg:justify-self-end">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.url}
        alt={slide.alt || 'Hospital slideshow image'}
        className="aspect-[4/3] w-full object-cover"
      />
      {slide.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-black/40 px-4 py-2 text-sm text-white">
          {slide.caption}
        </div>
      )}
      {slides.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

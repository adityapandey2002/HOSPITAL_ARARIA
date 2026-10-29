'use client';

import { useEffect } from 'react';

/**
 * Opens the home page on the hero.
 *
 * Chrome restores the previous scroll offset on reload, and the hero slideshow
 * replaces its placeholder with the managed image after hydration. Either can
 * leave a visitor halfway down the page — typically at "Citizen services" — on
 * a first paint. Resetting once the first frame is painted and once more after
 * the slideshow has settled keeps the hero in view.
 *
 * A URL with a `#section` hash, or any scroll gesture in the first moments, is
 * left alone: the visitor asked for that position.
 */
export function HomeScrollReset() {
  useEffect(() => {
    if (window.location.hash) return;

    let userMoved = false;
    const markMoved = () => {
      userMoved = true;
    };

    const toTop = () => {
      if (userMoved || window.scrollY === 0) return;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    const frame = window.requestAnimationFrame(toTop);
    const timer = window.setTimeout(toTop, 400);

    window.addEventListener('wheel', markMoved, { passive: true, once: true });
    window.addEventListener('touchstart', markMoved, { passive: true, once: true });
    window.addEventListener('keydown', markMoved, { once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener('wheel', markMoved);
      window.removeEventListener('touchstart', markMoved);
      window.removeEventListener('keydown', markMoved);
    };
  }, []);

  return null;
}

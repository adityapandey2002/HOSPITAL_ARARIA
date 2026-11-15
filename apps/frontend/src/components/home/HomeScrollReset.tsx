'use client';

import { useEffect } from 'react';

/**
 * Set once per document load. Returning to the home page from another route
 * (Back, or the logo link) must keep the position the visitor left, so only the
 * first mount of a full page load resets to the hero.
 */
let resetThisDocument = false;

function isBackForwardNavigation(): boolean {
  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return entry?.type === 'back_forward';
}

/**
 * Opens the home page on the hero.
 *
 * Chrome restores the previous scroll offset on reload, and the hero slideshow
 * replaces its placeholder with the managed image after hydration. Either can
 * leave a visitor halfway down the page — typically at "Citizen services" — on
 * a first paint. Resetting once the first frame is painted and once more after
 * the slideshow has settled keeps the hero in view.
 *
 * The reset is skipped when the visitor asked for a position: a URL with a
 * `#section` hash, a Back/Forward navigation, or any scroll gesture (including a
 * scrollbar drag) before the second frame.
 */
export function HomeScrollReset() {
  useEffect(() => {
    if (resetThisDocument || window.location.hash || isBackForwardNavigation()) return;
    resetThisDocument = true;

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
    window.addEventListener('pointerdown', markMoved, { once: true });
    window.addEventListener('keydown', markMoved, { once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener('wheel', markMoved);
      window.removeEventListener('touchstart', markMoved);
      window.removeEventListener('pointerdown', markMoved);
      window.removeEventListener('keydown', markMoved);
    };
  }, []);

  return null;
}

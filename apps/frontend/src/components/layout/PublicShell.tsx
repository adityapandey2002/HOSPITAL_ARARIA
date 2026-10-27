import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { MobileTabBar } from './MobileTabBar';

/**
 * The only public shell. It owns the sticky header, the single `<main>`
 * landmark, the footer and the mobile bottom bar; pages render sections only.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="flex-1 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-0"
      >
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}

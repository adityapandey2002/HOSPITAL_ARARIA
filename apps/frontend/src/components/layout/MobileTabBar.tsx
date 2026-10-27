'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV, isActivePath } from '@/config/navigation';
import { cn } from '@dh-araria/shared/utils';

/**
 * Fixed bottom bar below `lg`. The shell reserves matching bottom padding, so
 * the footer and the last form field are never covered.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.04)] lg:hidden"
    >
      <ul className="mx-auto flex h-[var(--bottom-nav-h)] max-w-xl items-stretch">
        {BOTTOM_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full min-h-11 flex-col items-center justify-center gap-1 px-1 text-label-sm transition-colors',
                  active ? 'text-primary-700' : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn('h-5 w-5', active && 'text-primary-700')}
                    aria-hidden="true"
                    strokeWidth={active ? 2.4 : 1.9}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

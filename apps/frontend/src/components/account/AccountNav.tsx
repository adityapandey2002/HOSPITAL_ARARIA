'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@dh-araria/shared/utils';

export const ACCOUNT_NAV: Array<{ href: string; label: string }> = [
  { href: '/account', label: 'Appointments' },
  { href: '/account/grievances', label: 'My grievances' },
  { href: '/account/profile', label: 'Profile' },
];

/** Thin account tab bar — shown under the patient's account shell. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Account"
      className="mx-auto flex min-w-0 flex-wrap gap-1.5 border-b border-outline-variant px-6 py-2"
    >
      {ACCOUNT_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary-600 text-white' : 'text-on-surface-variant hover:bg-surface-low'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

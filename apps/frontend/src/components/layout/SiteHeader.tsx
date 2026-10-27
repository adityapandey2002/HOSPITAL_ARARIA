'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarCheck,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Siren,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@dh-araria/ui/components';
import { cn } from '@dh-araria/shared/utils';
import { HOSPITAL, shortAddress, telHref } from '@/config/hospital';
import { CITIZEN_MENU, PRIMARY_ACTION, PUBLIC_NAV, isActivePath } from '@/config/navigation';

function BrandLockup({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      aria-label={`${HOSPITAL.name} home`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
          <path
            d="M12 3.5 4.5 7v5.2c0 4.3 3 7.4 7.5 8.3 4.5-.9 7.5-4 7.5-8.3V7L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 8.2v6.4M8.8 11.4h6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-heading text-[0.95rem] font-bold leading-tight text-on-surface sm:text-lg">
          District Hospital Araria
        </span>
        <span className="block text-label-sm text-on-surface-variant">{HOSPITAL.authority}</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const adminHref = '/admin/complaints';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-card shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Utility bar: location, reception, emergency and account. */}
      <div className="hidden bg-primary-800 text-white md:block">
        <Container size="wide" className="flex h-10 items-center justify-between gap-4 text-label-sm">
          <div className="flex min-w-0 items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {shortAddress()}
            </span>
            <a
              href={telHref(HOSPITAL.receptionPhone)}
              className="inline-flex items-center gap-1.5 rounded text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {HOSPITAL.receptionPhone}
            </a>
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <Siren className="h-3.5 w-3.5 text-warning-300" aria-hidden="true" />
              Emergency 108 / 102
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <Link
              href={PRIMARY_ACTION.href}
              className="rounded text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
            >
              Book appointment
            </Link>
            {isLoading ? (
              <span className="h-6 w-28 animate-pulse rounded bg-white/20" aria-hidden="true" />
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded border border-white/30 px-3 py-1 text-label-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded border border-white/30 px-3 py-1 text-label-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
              >
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                Login / Register
              </Link>
            )}
          </div>
        </Container>
      </div>

      {/* Primary bar. */}
      <Container size="wide" className="flex h-16 items-center justify-between gap-3 md:h-[4.5rem]">
        <BrandLockup onNavigate={() => setMenuOpen(false)} />

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 xl:flex">
          {PUBLIC_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {isStaff && (
            <Link
              href={adminHref}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-label text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              {user?.role === 'ADMIN' ? 'Admin panel' : 'Complaint desk'}
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={PRIMARY_ACTION.href}
            className="hidden min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-label text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 lg:inline-flex"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Book appointment
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 xl:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {/* Drawer. Rendered only while open so nothing sits in the focus order. */}
      {menuOpen && (
        <div
          id="site-menu"
          className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 overflow-y-auto overscroll-contain border-t border-outline-variant bg-card xl:hidden"
        >
          <Container size="wide" className="py-4 pb-24">
            <nav aria-label="All pages">
              <p className="px-2 pb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                Portal
              </p>
              <ul className="space-y-1">
                {PUBLIC_NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                          active ? 'bg-primary-50 text-primary-800' : 'text-on-surface hover:bg-surface-low'
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5 shrink-0 text-primary-700" aria-hidden="true" />}
                        <span className="min-w-0">
                          <span className="block text-label">{item.label}</span>
                          {item.description && (
                            <span className="block truncate text-label-sm font-normal text-on-surface-variant">
                              {item.description}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="px-2 pb-2 pt-5 text-label-sm uppercase tracking-wider text-on-surface-variant">
                {CITIZEN_MENU.title}
              </p>
              <ul className="space-y-1">
                {CITIZEN_MENU.links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-on-surface transition-colors hover:bg-surface-low"
                      >
                        {Icon && <Icon className="h-5 w-5 shrink-0 text-primary-700" aria-hidden="true" />}
                        <span className="block text-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
                {isStaff && (
                  <li>
                    <Link
                      href={adminHref}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 rounded-lg bg-primary-50 px-3 py-2 text-label text-primary-800"
                    >
                      {user?.role === 'ADMIN' ? 'Admin panel' : 'Complaint desk'}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className="mt-6 rounded-xl border border-outline-variant bg-surface-low p-4">
              <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">Emergency</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {HOSPITAL.emergencyNumbers.map((entry) => (
                  <a
                    key={entry.number}
                    href={telHref(entry.number)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emergency px-4 py-2 text-label text-white transition-colors hover:bg-emergency-dark"
                  >
                    <Siren className="h-4 w-4" aria-hidden="true" />
                    {entry.label} {entry.number}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label text-on-surface transition-colors hover:bg-surface-low"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label text-on-surface transition-colors hover:bg-surface-low"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Login / Register
                </Link>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

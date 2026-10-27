'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminNavForRole, isActivePath } from '@/config/navigation';
import { HOSPITAL } from '@/config/hospital';
import { cn } from '@dh-araria/shared/utils';
import { useState } from 'react';

/**
 * Staff shell: persistent sidebar from `lg`, a compact top bar with the same
 * navigation in a sheet below it. One shell for every admin page — the tab row
 * that used to live inside `/admin` is gone.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const items = adminNavForRole(user?.role);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const navList = (onNavigate?: () => void) => (
    <nav aria-label="Admin navigation" className="space-y-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950',
              active ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
            )}
          >
            {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />}
            <span className="min-w-0">
              <span className="block text-label">{item.label}</span>
              {item.description && (
                <span className="mt-0.5 block text-label-sm font-normal text-white/55">{item.description}</span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="hidden w-[var(--admin-sidebar-w)] shrink-0 flex-col bg-primary-950 lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-heading text-sm font-bold text-white">{HOSPITAL.shortName} staff</span>
              <span className="block text-label-sm text-white/60">Operations portal</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">{navList()}</div>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-label text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to public site
          </Link>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-label text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          ) : (
            !isLoading && (
              <Link
                href="/login"
                className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 text-label text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-card shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 lg:hidden"
                aria-label="Open admin navigation"
                aria-expanded={navOpen}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-bold text-on-surface">Staff operations</p>
                <p className="truncate text-label-sm text-on-surface-variant">
                  {user ? `${user.name} · ${user.role === 'ADMIN' ? 'Administrator' : 'Staff'}` : 'Sign in to act on requests'}
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="hidden min-h-10 items-center gap-2 rounded-lg border border-outline-variant px-3 text-label text-on-surface transition-colors hover:bg-surface-low sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Public site
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1rem)] pt-5 sm:px-6 lg:px-8 lg:pb-10"
        >
          {!isLoading && !isAuthenticated && (
            <div className="mb-5 flex flex-col gap-2 rounded-xl border border-warning-200 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-sm text-warning-900">
                You are not signed in. Panels will ask you to sign in before showing patient data.
              </p>
              <Link
                href="/login?redirect=/admin/complaints"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-label text-white transition-colors hover:bg-primary-700"
              >
                Sign in
              </Link>
            </div>
          )}
          {children}
        </main>

        <nav
          aria-label="Admin quick navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.04)] lg:hidden"
        >
          <ul className="mx-auto flex h-[var(--bottom-nav-h)] max-w-xl items-stretch">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-full min-h-11 flex-col items-center justify-center gap-1 px-1 text-label-sm transition-colors',
                      active ? 'text-primary-700' : 'text-on-surface-variant'
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={active ? 2.4 : 1.9} />}
                    <span className="w-full truncate px-0.5 text-center">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-on-surface/50"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-primary-950"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="font-heading text-sm font-bold text-white">Staff operations</span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close admin navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{navList(() => setNavOpen(false))}</div>
          </div>
        </div>
      )}
    </div>
  );
}

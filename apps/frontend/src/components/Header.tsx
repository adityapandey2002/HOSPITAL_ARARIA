'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Hospital,
  Phone,
  MapPin,
  AlertCircle,
  User,
  Calendar,
  Droplet,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@dh-araria/ui/components';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/blood-bank', label: 'Blood Bank' },
  { href: '/grievances', label: 'Grievances' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/complaint', label: 'Complaint' },
  { href: '/complaints/track', label: 'Track Complaint' },
  { href: '/notices', label: 'Notices' },
  { href: '/contact', label: 'Contact' },
];

const emergencyContacts = [
  { label: 'Ambulance', number: '102', icon: AlertCircle },
  { label: 'Emergency', number: '108', icon: AlertCircle },
  { label: 'Blood Bank', number: '+91-6453-222102', icon: Droplet },
];

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = isAdmin || user?.role === 'STAFF';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // While auth is loading, show a neutral state (no login/logout toggle yet)
  if (isLoading) {
    return (
      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-40 transition-all duration-300',
          isScrolled ? 'bg-white/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
        )}
      >
        {/* Top Bar */}
        <div className="hidden items-center justify-between bg-blue-700 px-4 py-2 text-sm text-white md:flex">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Araria, Bihar - 854311</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+91-6453-222123</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-200" />
              <span className="text-yellow-100">Emergency: 108 / 102</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/appointments" className="transition-colors hover:text-blue-100">
              Book Appointment
            </Link>
            <div className="rounded-lg bg-white/10 px-4 py-1.5 transition-colors hover:bg-white/20">
              Loading…
            </div>
          </div>
        </div>
        <nav className="relative border-b border-gray-100 bg-white" aria-label="Main navigation">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-3"
                aria-label="District Hospital Araria Home"
              >
                <div className="rounded-lg bg-blue-600 p-2">
                  <Hospital className="h-7 w-7 text-white" />
                </div>
                <div className="hidden sm:block xl:hidden 2xl:block">
                  <h1 className="text-xl font-bold text-gray-900">District Hospital Araria</h1>
                  <p className="text-xs text-gray-500">Government of Bihar</p>
                </div>
              </Link>
              <div className="hidden items-center gap-1 xl:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="hidden items-center gap-3 xl:flex">
                <Link
                  href="/appointments"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Calendar className="mr-2 inline h-4 w-4" />
                  Book Appointment
                </Link>
                <div className="rounded-lg bg-white/10 px-4 py-1.5 transition-colors hover:bg-white/20">
                  Loading…
                </div>
              </div>
              <button
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 xl:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                disabled
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-40 transition-all duration-300',
        isScrolled ? 'bg-white/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
      )}
    >
      {/* Top Bar */}
      <div className="hidden items-center justify-between bg-blue-700 px-4 py-2 text-sm text-white md:flex">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Araria, Bihar - 854311</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>+91-6453-222123</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-200" />
            <span className="text-yellow-100">Emergency: 108 / 102</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/appointments" className="transition-colors hover:text-blue-100">
            Book Appointment
          </Link>
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-white/10 px-4 py-1.5 transition-colors hover:bg-white/20"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="relative border-b border-gray-100 bg-white" aria-label="Main navigation">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="District Hospital Araria Home"
            >
              <div className="rounded-lg bg-blue-600 p-2">
                <Hospital className="h-7 w-7 text-white" />
              </div>
              <div className="hidden sm:block xl:hidden 2xl:block">
                <h1 className="text-xl font-bold text-gray-900">District Hospital Araria</h1>
                <p className="text-xs text-gray-500">Government of Bihar</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-1 xl:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  {item.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  href="/admin/complaints"
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 bg-blue-50 text-blue-600"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {isAdmin ? 'Admin Panel' : 'Complaint Desk'}
                </Link>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-3 xl:flex">
              <Link
                href="/appointments"
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Calendar className="mr-2 inline h-4 w-4" />
                Book Appointment
              </Link>
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-blue-600"
                >
                  <User className="mr-2 inline h-4 w-4" />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 xl:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            id="mobile-menu"
            className={cn(
              'overflow-hidden border-t border-gray-100 transition-all duration-300 ease-in-out xl:hidden',
              isMenuOpen ? 'max-h-[85vh] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="space-y-2 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  href="/admin/complaints"
                  className="block rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 bg-blue-50 text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {isAdmin ? 'Admin Panel' : 'Complaint Desk'}
                </Link>
              )}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <Link
                  href="/appointments"
                  className="block rounded-lg bg-blue-600 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="mr-2 inline h-4 w-4" />
                  Book Appointment
                </Link>
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Link
                    href="/login"
                    className="block py-3 text-center font-medium text-gray-700 transition-colors hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    Login / Register
                  </Link>
                )}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 px-4 text-sm font-medium text-gray-500">Emergency Contacts</p>
                <div className="space-y-2 px-4">
                  {emergencyContacts.map((contact) => (
                    <a
                      key={contact.label}
                      href={`tel:${contact.number}`}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <contact.icon className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{contact.label}</p>
                        <p className="text-sm text-gray-500">{contact.number}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

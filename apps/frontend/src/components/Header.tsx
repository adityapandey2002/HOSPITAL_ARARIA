'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Hospital, Phone, MapPin, AlertCircle, User, Calendar, Droplet } from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/blood-bank', label: 'Blood Bank' },
  { href: '/grievances', label: 'Grievances' },
  { href: '/notices', label: 'Notices' },
  { href: '/contact', label: 'Contact' },
];

const emergencyContacts = [
  { label: 'Ambulance', number: '102', icon: AlertCircle },
  { label: 'Emergency', number: '108', icon: AlertCircle },
  { label: 'Blood Bank', number: '+91-6453-222102', icon: Droplet },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setIsScrolled(window.scrollY > 20);
    }, { passive: true });
  }

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-transparent'
    )}>
      {/* Top Bar */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 bg-primary-700 text-white text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Araria, Bihar - 854311</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>+91-6453-222123</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-200" />
            <span className="text-yellow-100">Emergency: 108 / 102</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/appointments" className="hover:text-primary-100 transition-colors">
            Book Appointment
          </Link>
          <Link href="/login" className="bg-white/10 px-4 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
            Login / Register
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="relative bg-white border-b border-gray-100" aria-label="Main navigation">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3" aria-label="District Hospital Araria Home">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Hospital className="w-7 h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl text-gray-900">District Hospital Araria</h1>
                <p className="text-xs text-gray-500">Government of Bihar</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/appointments"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                Book Appointment
              </Link>
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 font-medium transition-colors"
              >
                <User className="w-4 h-4 mr-2 inline" />
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            id="mobile-menu"
            className={cn(
              'md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100',
              isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link
                  href="/appointments"
                  className="block bg-primary-600 text-white text-center py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="w-4 h-4 mr-2 inline" />
                  Book Appointment
                </Link>
                <Link
                  href="/login"
                  className="block text-center text-gray-700 py-3 font-medium hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2 inline" />
                  Login / Register
                </Link>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="px-4 text-sm font-medium text-gray-500 mb-2">Emergency Contacts</p>
                <div className="space-y-2 px-4">
                  {emergencyContacts.map((contact) => (
                    <a
                      key={contact.label}
                      href={`tel:${contact.number}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <contact.icon className="w-5 h-5 text-danger-500" />
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
'use client';

import Link from 'next/link';
import {
  Hospital,
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowUpRight,
  Shield,
  Award,
  Heart,
} from 'lucide-react';

/**
 * `/services/[id]` is keyed by department UUID, so a department name cannot be
 * turned into a detail URL. Send people to the searchable list instead.
 */
function serviceSearchHref(name: string): string {
  return `/services?q=${encodeURIComponent(name)}`;
}

const footerLinks = {
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Doctors', href: '/doctors' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Blood Bank', href: '/blood-bank' },
    { label: 'Grievances', href: '/grievances' },
    { label: 'Feedback', href: '/feedback' },
    { label: 'Complaint', href: '/complaint' },
    { label: 'Notices', href: '/notices' },
    { label: 'Contact Us', href: '/contact' },
  ],
  services: [
    { label: 'Emergency Services', href: serviceSearchHref('Emergency Services') },
    { label: 'OPD Services', href: serviceSearchHref('OPD Services') },
    { label: 'Diagnostic Services', href: serviceSearchHref('Diagnostic Services') },
    { label: 'Blood Bank', href: '/blood-bank' },
    { label: 'Ambulance Service', href: serviceSearchHref('Ambulance Service') },
    { label: 'Pharmacy', href: serviceSearchHref('Pharmacy') },
    { label: 'Physiotherapy', href: serviceSearchHref('Physiotherapy') },
    { label: 'Dietary Services', href: serviceSearchHref('Dietary Services') },
  ],
  departments: [
    { label: 'General Medicine', href: serviceSearchHref('General Medicine') },
    { label: 'Pediatrics', href: serviceSearchHref('Pediatrics') },
    { label: 'Obstetrics & Gynecology', href: serviceSearchHref('Obstetrics & Gynecology') },
    { label: 'Orthopedics', href: serviceSearchHref('Orthopedics') },
    { label: 'General Surgery', href: serviceSearchHref('General Surgery') },
    { label: 'Ophthalmology', href: serviceSearchHref('Ophthalmology') },
    { label: 'ENT', href: serviceSearchHref('ENT') },
    { label: 'Dermatology', href: serviceSearchHref('Dermatology') },
  ],
  patientResources: [
    { label: 'Patient Rights', href: '/patient-rights' },
    { label: 'Insurance & Schemes', href: '/insurance' },
    { label: 'Feedback', href: '/feedback' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Download Forms', href: '/forms' },
    { label: 'Health Tips', href: '/health-tips' },
  ],
};

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/dhararia' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/dhararia' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/dhararia' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/dhararia' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-3"
              aria-label="District Hospital Araria Home"
            >
              <div className="rounded-lg bg-primary-600 p-2">
                <Hospital className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">District Hospital Araria</h2>
                <p className="text-xs text-gray-400">Government of Bihar</p>
              </div>
            </Link>

            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Providing quality healthcare services to the community since 1985. Committed to
              excellence, compassion, and accessibility.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-all duration-200 hover:bg-primary-600 hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors hover:text-primary-400 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Our Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors hover:text-primary-400 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Departments</h3>
            <ul className="space-y-3">
              {footerLinks.departments.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors hover:text-primary-400 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Patient Resources */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Patient Resources</h3>
            <ul className="space-y-3">
              {footerLinks.patientResources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors hover:text-primary-400 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Contact Us</h3>
            <address className="space-y-3 text-sm not-italic">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-400" />
                <div>
                  <p className="text-gray-300">Araria, Bihar - 854311</p>
                  <p className="text-gray-400">Near District Collectorate</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-primary-400" />
                <a
                  href="tel:+91-6453-222123"
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  +91-6453-222123
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-primary-400" />
                <a href="tel:108" className="text-gray-300 transition-colors hover:text-white">
                  Emergency: 108
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-primary-400" />
                <a
                  href="mailto:dh.araria@bihar.gov.in"
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  dh.araria@bihar.gov.in
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-primary-400" />
                <span className="text-gray-300">OPD: Mon-Sat 9AM-4PM</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-primary-400" />
                <span className="text-gray-300">Emergency: 24/7</span>
              </div>
            </address>
          </div>
        </div>

        {/* Accreditations & Certifications */}
        <div className="mb-8 border-t border-gray-800 pt-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">Accreditations:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-primary-800 bg-primary-900/30 px-3 py-1">
                  <Shield className="h-4 w-4 text-primary-400" />
                  <span className="text-sm text-primary-300">NABH Accredited</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-secondary-800 bg-secondary-900/30 px-3 py-1">
                  <Award className="h-4 w-4 text-secondary-400" />
                  <span className="text-sm text-secondary-300">GIGW 3.0 Compliant</span>
                </div>
                <div className="bg-danger-900/30 border-danger-800 flex items-center gap-2 rounded-lg border px-3 py-1">
                  <Heart className="text-danger-400 h-4 w-4" />
                  <span className="text-danger-300 text-sm">ABDM Integrated</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Initiative by:</span>
              <span className="font-medium text-white">Department of Health, Govt. of Bihar</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} District Hospital Araria. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/accessibility" className="transition-colors hover:text-white">
              Accessibility Statement
            </Link>
            <Link href="/sitemap" className="transition-colors hover:text-white">
              Sitemap
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-danger-500" />
            <span>for citizens of Bihar</span>
          </div>
        </div>

        {/* Back to Top */}
        <a
          href="#main-content"
          className="invisible fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white opacity-0 shadow-lg transition-all duration-200 hover:bg-primary-700 group-hover:visible group-hover:opacity-100"
          aria-label="Back to top"
        >
          <ArrowUpRight className="h-6 w-6" />
        </a>
      </div>
    </footer>
  );
}

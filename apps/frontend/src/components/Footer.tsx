'use client';

import Link from 'next/link';
import { 
  Hospital, MapPin, Phone, Mail, Clock, 
  Facebook, Twitter, Instagram, Youtube,
  ArrowUpRight, Shield, Award, Heart,
  Facebook as FacebookIcon, Twitter as TwitterIcon, Instagram as InstagramIcon, Youtube as YoutubeIcon
} from 'lucide-react';

const footerLinks = {
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Doctors', href: '/doctors' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Blood Bank', href: '/blood-bank' },
    { label: 'Grievances', href: '/grievances' },
    { label: 'Notices', href: '/notices' },
    { label: 'Contact Us', href: '/contact' },
  ],
  services: [
    { label: 'Emergency Services', href: '/services/emergency' },
    { label: 'OPD Services', href: '/services/opd' },
    { label: 'Diagnostic Services', href: '/services/diagnostics' },
    { label: 'Blood Bank', href: '/blood-bank' },
    { label: 'Ambulance Service', href: '/services/ambulance' },
    { label: 'Pharmacy', href: '/services/pharmacy' },
    { label: 'Physiotherapy', href: '/services/physiotherapy' },
    { label: 'Dietary Services', href: '/services/dietary' },
  ],
  departments: [
    { label: 'General Medicine', href: '/services/general-medicine' },
    { label: 'Pediatrics', href: '/services/pediatrics' },
    { label: 'Obstetrics & Gynecology', href: '/services/obstetrics-gynecology' },
    { label: 'Orthopedics', href: '/services/orthopedics' },
    { label: 'General Surgery', href: '/services/surgery' },
    { label: 'Ophthalmology', href: '/services/ophthalmology' },
    { label: 'ENT', href: '/services/ent' },
    { label: 'Dermatology', href: '/services/dermatology' },
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
  { icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com/dhararia' },
  { icon: TwitterIcon, label: 'Twitter', href: 'https://twitter.com/dhararia' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com/dhararia' },
  { icon: YoutubeIcon, label: 'YouTube', href: 'https://youtube.com/dhararia' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4" aria-label="District Hospital Araria Home">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Hospital className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">District Hospital Araria</h2>
                <p className="text-xs text-gray-400">Government of Bihar</p>
              </div>
            </Link>
            
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Providing quality healthcare services to the community since 1985. 
              Committed to excellence, compassion, and accessibility.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Our Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h3 className="font-semibold text-white mb-4">Departments</h3>
            <ul className="space-y-3">
              {footerLinks.departments.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Patient Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Patient Resources</h3>
            <ul className="space-y-3">
              {footerLinks.patientResources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <address className="not-italic space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-300">Araria, Bihar - 854311</p>
                  <p className="text-gray-400">Near District Collectorate</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="tel:+91-6453-222123" className="text-gray-300 hover:text-white transition-colors">+91-6453-222123</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="tel:108" className="text-gray-300 hover:text-white transition-colors">Emergency: 108</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="mailto:dh.araria@bihar.gov.in" className="text-gray-300 hover:text-white transition-colors">dh.araria@bihar.gov.in</a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300">OPD: Mon-Sat 9AM-4PM</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300">Emergency: 24/7</span>
              </div>
            </address>
          </div>
        </div>

        {/* Accreditations & Certifications */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">Accreditations:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-900/30 rounded-lg border border-primary-800">
                  <Shield className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-primary-300">NABH Accredited</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary-900/30 rounded-lg border border-secondary-800">
                  <Award className="w-4 h-4 text-secondary-400" />
                  <span className="text-sm text-secondary-300">GIGW 3.0 Compliant</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-danger-900/30 rounded-lg border border-danger-800">
                  <Heart className="w-4 h-4 text-danger-400" />
                  <span className="text-sm text-danger-300">ABDM Integrated</span>
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} District Hospital Araria. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility Statement</Link>
            <Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-danger-500" />
            <span>for citizens of Bihar</span>
          </div>
        </div>

        {/* Back to Top */}
        <a 
          href="#main-content" 
          className="fixed bottom-6 right-6 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50"
          aria-label="Back to top"
        >
          <ArrowUpRight className="w-6 h-6" />
        </a>
      </div>
    </footer>
  );
}
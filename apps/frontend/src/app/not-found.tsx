import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const HELPFUL_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Doctors', href: '/doctors' },
  { label: 'Appointments', href: '/appointments' },
  { label: 'Contact', href: '/contact' },
];

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16"
    >
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Page not found</h1>
        <p className="mt-3 text-gray-600">
          The page you are looking for does not exist or has moved.
        </p>

        <nav aria-label="Helpful links" className="mt-8">
          <ul className="space-y-2">
            {HELPFUL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-primary-200 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 text-sm text-gray-600">
          Need help? Call the hospital help desk on{' '}
          <a
            href="tel:+91-6453-222123"
            className="font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            +91-6453-222123
          </a>
          .
        </p>
      </div>
    </main>
  );
}

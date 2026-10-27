import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Sitemap | District Hospital Araria',
  description: 'Sitemap of District Hospital Araria website.',
};

export default function SitemapPage() {
  const pages = [
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Doctors', url: '/doctors' },
    { name: 'Appointments', url: '/appointments' },
    { name: 'Blood Bank', url: '/blood-bank' },
    { name: 'Grievances', url: '/grievances' },
    { name: 'Feedback', url: '/feedback' },
    { name: 'Complaint', url: '/complaint' },
    { name: 'Track Complaint', url: '/complaints/track' },
    { name: 'Notices', url: '/notices' },
    { name: 'Contact', url: '/contact' },
    { name: 'Login / Register', url: '/login' },
    { name: 'Patient Rights', url: '/patient-rights' },
    { name: 'Insurance & Schemes', url: '/insurance' },
    { name: 'FAQs', url: '/faqs' },
    { name: 'Download Forms', url: '/forms' },
    { name: 'Health Tips', url: '/health-tips' },
    { name: 'Privacy Policy', url: '/privacy' },
    { name: 'Terms of Service', url: '/terms' },
    { name: 'Accessibility', url: '/accessibility' },
  ];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Sitemap</h1>
            <p className="mt-2 text-primary-100">
              Navigation map of the District Hospital Araria website.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto space-y-2">
              {pages.map((page) => (
                <div key={page.url} className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <a href={page.url} className="text-primary-700 font-medium hover:text-primary-800 block">
                    {page.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

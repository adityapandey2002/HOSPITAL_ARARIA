import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NoticesList } from '@/components/NoticesList';

export const metadata: Metadata = {
  title: 'Notices & Announcements',
  description: 'Latest notices, circulars, recruitment updates, tenders, and public health advisories from District Hospital Araria.',
};

export default function NoticesPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-primary-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Notices & Announcements</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Stay updated with official circulars, recruitment notices, tenders, and public health advisories.
            </p>
          </div>
        </section>

        <NoticesList />
      </main>
      <Footer />
    </>
  );
}
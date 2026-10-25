import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminComplaintsPanel } from '@/components/complaints/AdminComplaintsPanel';

export const metadata: Metadata = {
  title: 'Complaints Admin Panel',
  description:
    'Track and resolve citizen complaints at District Hospital Araria. Staff only.',
  robots: { index: false, follow: false },
};

export default function AdminComplaintsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-700 py-10 text-white sm:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Complaints admin panel</h1>
            <p className="mt-2 max-w-3xl text-primary-100">
              Track every complaint live, update its status, and mark it resolved when fixed.
            </p>
          </div>
        </section>

        <AdminComplaintsPanel />
      </main>
      <Footer />
    </>
  );
}

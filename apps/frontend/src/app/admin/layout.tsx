import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminTabs } from '@/app/admin/AdminTabs';

export const metadata: Metadata = {
  title: 'Admin Panel | District Hospital Araria',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-700 py-10 text-white sm:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Admin Panel</h1>
            <p className="mt-2 max-w-3xl text-primary-100">
              Manage complaints, feedback, doctors, and department access for District Hospital Araria.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <AdminTabs />
        </div>

        <div className="container mx-auto px-4 pb-12">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

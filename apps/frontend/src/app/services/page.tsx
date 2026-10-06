import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DepartmentsList } from '@/components/DepartmentsList';
import { EmergencyServices } from '@/components/EmergencyServices';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore all medical services and departments at District Hospital Araria. From emergency care to specialized treatments.',
};

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-primary-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Our Medical Services</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Comprehensive healthcare services across 15+ specialized departments, 
              24/7 emergency care, and advanced diagnostic facilities.
            </p>
          </div>
        </section>

        <DepartmentsList />
        <EmergencyServices />
      </main>
      <Footer />
    </>
  );
}
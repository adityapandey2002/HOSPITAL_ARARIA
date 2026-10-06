import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GrievanceForm } from '@/components/GrievanceForm';

export const metadata: Metadata = {
  title: 'Grievance Redressal',
  description: 'File complaints and track grievance status at District Hospital Araria. Integrated with CPGRAMS for transparent resolution.',
};

export default function GrievancesPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-warning-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Grievance Redressal</h1>
            <p className="text-xl text-warning-100 max-w-3xl mx-auto">
              File complaints, track status, and get timely resolution. Integrated with CPGRAMS for transparent 30-day resolution timeline.
            </p>
          </div>
        </section>

        <GrievanceForm />
      </main>
      <Footer />
    </>
  );
}
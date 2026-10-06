import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DoctorsList } from '@/components/DoctorsList';

export const metadata: Metadata = {
  title: 'Our Doctors',
  description: 'Meet our team of 50+ specialist doctors across 15+ departments at District Hospital Araria. View profiles, qualifications, and book appointments.',
};

export default function DoctorsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-primary-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Our Specialist Doctors</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Highly qualified and experienced medical professionals dedicated to your health and wellbeing.
            </p>
          </div>
        </section>

        <DoctorsList />
      </main>
      <Footer />
    </>
  );
}
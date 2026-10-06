import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AppointmentBooking } from '@/components/AppointmentBooking';

export const metadata: Metadata = {
  title: 'Book Appointment',
  description: 'Book your appointment online at District Hospital Araria. Choose your doctor, select a convenient time slot, and get instant confirmation.',
};

export default function AppointmentsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-primary-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Book an Appointment</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Schedule your consultation with our specialist doctors. Quick, easy, and secure online booking.
            </p>
          </div>
        </section>

        <AppointmentBooking />
      </main>
      <Footer />
    </>
  );
}
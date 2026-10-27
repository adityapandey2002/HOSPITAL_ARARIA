import { Metadata } from 'next';
import { DoctorsList } from '@/components/DoctorsList';

export const metadata: Metadata = {
  title: 'Our Doctors',
  description:
    'Meet our team of 50+ specialist doctors across 15+ departments at District Hospital Araria. View profiles, qualifications, and book appointments.',
};

export default function DoctorsPage() {
  return (
    <>
      <div>
        <section className="bg-primary-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Our Specialist Doctors</h1>
            <p className="mx-auto max-w-3xl text-xl text-primary-100">
              Highly qualified and experienced medical professionals dedicated to your health and
              wellbeing.
            </p>
          </div>
        </section>

        <DoctorsList />
      </div>
    </>
  );
}

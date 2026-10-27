import { Metadata } from 'next';
import { GrievanceForm } from '@/components/GrievanceForm';

export const metadata: Metadata = {
  title: 'Grievance Redressal',
  description:
    'File complaints and track grievance status at District Hospital Araria. Transparent resolution by the hospital administration.',
};

export default function GrievancesPage() {
  return (
    <>
      <div>
        <section className="bg-warning-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Grievance Redressal</h1>
            <p className="mx-auto max-w-3xl text-xl text-warning-100">
              File complaints, track status, and get timely resolution. Handled by the hospital
              transparent 30-day resolution timeline.
            </p>
          </div>
        </section>

        <GrievanceForm />
      </div>
    </>
  );
}

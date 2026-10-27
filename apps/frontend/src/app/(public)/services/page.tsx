import { Metadata } from 'next';
import { DepartmentsList } from '@/components/DepartmentsList';
import { EmergencyServices } from '@/components/EmergencyServices';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Explore all medical services and departments at District Hospital Araria. From emergency care to specialized treatments.',
};

export default function ServicesPage() {
  return (
    <>
      <div>
        <section className="bg-primary-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Our Medical Services</h1>
            <p className="mx-auto max-w-3xl text-xl text-primary-100">
              Comprehensive healthcare services across 15+ specialized departments, 24/7 emergency
              care, and advanced diagnostic facilities.
            </p>
          </div>
        </section>

        <DepartmentsList />
        <EmergencyServices />
      </div>
    </>
  );
}

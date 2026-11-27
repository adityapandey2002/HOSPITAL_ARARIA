import { Metadata } from 'next';
import { AppointmentBooking } from '@/components/AppointmentBooking';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Book Appointment',
  description:
    'Book your appointment online at District Hospital Araria. Choose your doctor, select a convenient time slot, and get instant confirmation.',
};

export default function AppointmentsPage() {
  return (
    <div>
      <PageBanner
        eyebrow="OPD Scheduling"
        accent="primary"
        title="Book an Appointment"
        description="Schedule your consultation with our specialist doctors. Quick, easy, and secure online booking."
      />

      <AppointmentBooking />
    </div>
  );
}

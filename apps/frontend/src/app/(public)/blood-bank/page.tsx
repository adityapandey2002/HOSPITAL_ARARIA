import { Metadata } from 'next';
import { BloodBankInventory } from '@/components/BloodBankInventory';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Blood Bank & Availability',
  description:
    'Check live blood availability at District Hospital Araria Blood Bank and blood centres across Araria district via e-RaktKosh.',
};

export default function BloodBankPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Blood Services"
        accent="danger"
        title="Blood Bank & Availability"
        description="Live blood stock from District Hospital Araria and Araria district blood centres (e-RaktKosh). Filter by facility, blood group, and component."
      />

      <BloodBankInventory />
    </div>
  );
}

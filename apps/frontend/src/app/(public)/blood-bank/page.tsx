import { Metadata } from 'next';
import { BloodBankInventory } from '@/components/BloodBankInventory';

export const metadata: Metadata = {
  title: 'Blood Bank',
  description:
    'Check blood availability at District Hospital Araria Blood Bank. Updated by the hospital blood bank.',
};

export default function BloodBankPage() {
  return (
    <>
      <div>
        <section className="bg-danger-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Blood Bank Inventory</h1>
            <p className="mx-auto max-w-3xl text-xl text-danger-100">
              Blood stock availability. Updated by the hospital blood bank for accurate,
              up-to-date information.
            </p>
          </div>
        </section>

        <BloodBankInventory />
      </div>
    </>
  );
}

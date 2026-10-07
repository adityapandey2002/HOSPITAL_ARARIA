import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BloodBankInventory } from '@/components/BloodBankInventory';

export const metadata: Metadata = {
  title: 'Blood Bank',
  description:
    'Check real-time blood availability at District Hospital Araria Blood Bank. Integrated with e-RaktKosh for up-to-date inventory.',
};

export default function BloodBankPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-danger-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Blood Bank Inventory</h1>
            <p className="mx-auto max-w-3xl text-xl text-danger-100">
              Real-time blood stock availability. Integrated with e-RaktKosh for accurate,
              up-to-date information.
            </p>
          </div>
        </section>

        <BloodBankInventory />
      </main>
      <Footer />
    </>
  );
}

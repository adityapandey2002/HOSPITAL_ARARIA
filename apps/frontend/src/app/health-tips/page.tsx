import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Health Tips | District Hospital Araria',
  description: 'Health tips and wellness advice from District Hospital Araria.',
};

export default function HealthTipsPage() {
  const tips = [
    {
      title: 'Stay Hydrated',
      desc: 'Drink at least 8 glasses of water daily to maintain good health, especially during summer.',
    },
    {
      title: 'Regular Exercise',
      desc: 'Engage in at least 30 minutes of physical activity every day to stay fit and healthy.',
    },
    {
      title: 'Balanced Diet',
      desc: 'Eat a variety of fruits, vegetables, whole grains, and proteins for proper nutrition.',
    },
    {
      title: 'Regular Checkups',
      desc: 'Visit your doctor for regular health checkups to detect issues early.',
    },
    {
      title: 'Vaccination',
      desc: 'Keep your vaccinations up to date to protect against preventable diseases.',
    },
    {
      title: 'Mental Health',
      desc: 'Take care of your mental health. Seek help if you feel stressed or anxious.',
    },
  ];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Health Tips</h1>
            <p className="mt-2 text-primary-100">
              Simple wellness advice to keep you and your family healthy.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip) => (
                <div key={tip.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">{tip.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

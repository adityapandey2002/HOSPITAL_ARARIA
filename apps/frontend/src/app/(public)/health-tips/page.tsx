import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';

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
      <div>
        <PageBanner
          eyebrow="Public Health"
          align="left"
          accent="primary"
          title="Health Tips"
          description="Simple everyday wellness guidance to help keep you and your family healthy."
        />

        <div className="bg-white py-6 sm:py-8">
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
      </div>
    </>
  );
}

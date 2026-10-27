import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patient Rights | District Hospital Araria',
  description: 'Patient rights and responsibilities at District Hospital Araria.',
};

export default function PatientRightsPage() {
  return (
    <>
      <div>
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Patient Rights</h1>
            <p className="mt-2 text-primary-100">
              Know your rights as a patient at District Hospital Araria.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
              <h2 className="text-xl font-bold text-gray-900 mt-8">Your Rights as a Patient</h2>
              <ul className="list-disc list-inside space-y-3 text-gray-600 mt-4">
                <li>Right to receive respectful and considerate care.</li>
                <li>Right to privacy and confidentiality of medical records.</li>
                <li>Right to be informed about your diagnosis, treatment, and prognosis.</li>
                <li>Right to consent to or refuse treatment.</li>
                <li>Right to access your medical records.</li>
                <li>Right to voice complaints and grievances without fear of discrimination.</li>
                <li>Right to know the names and roles of your caregivers.</li>
                <li>Right to receive emergency care regardless of ability to pay.</li>
                <li>Right to be informed about the cost of treatment.</li>
                <li>Right to a second opinion.</li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900 mt-8">Your Responsibilities</h2>
              <ul className="list-disc list-inside space-y-3 text-gray-600 mt-4 mb-8">
                <li>Provide accurate and complete health information.</li>
                <li>Follow the treatment plan prescribed by your doctor.</li>
                <li>Respect hospital staff and other patients.</li>
                <li>Keep appointments or notify the hospital in advance of cancellations.</li>
                <li>Pay your bills promptly.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

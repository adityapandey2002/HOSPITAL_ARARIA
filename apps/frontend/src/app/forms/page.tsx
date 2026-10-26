import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@dh-araria/ui/components';

export const metadata: Metadata = {
  title: 'Download Forms | District Hospital Araria',
  description: 'Download hospital forms, consent forms, and application forms.',
};

export default function FormsPage() {
  const forms = [
    {
      name: 'Patient Registration Form',
      desc: 'Form for new patient registration at the hospital.',
      type: 'PDF',
    },
    {
      name: 'Consent Form',
      desc: 'General medical consent form for procedures.',
      type: 'PDF',
    },
    {
      name: 'Medico-Legal Case Form',
      desc: 'Form for medico-legal cases.',
      type: 'PDF',
    },
    {
      name: 'Birth Registration Form',
      desc: 'Form for birth registration at the hospital.',
      type: 'PDF',
    },
    {
      name: 'Death Registration Form',
      desc: 'Form for death registration at the hospital.',
      type: 'PDF',
    },
    {
      name: 'Complaint Form',
      desc: 'Form for filing complaints and grievances.',
      type: 'PDF',
    },
  ];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Download Forms</h1>
            <p className="mt-2 text-primary-100">
              Download hospital forms, consent forms, and application forms.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <div
                  key={form.name}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col h-full"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{form.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{form.desc}</p>
                    <span className="mt-2 inline-block text-xs font-medium text-primary-600 uppercase">
                      {form.type}
                    </span>
                  </div>
                  <Button className="mt-auto w-full" variant="outline">
                    <a href="#" className="text-primary-700 font-medium hover:text-primary-800">
                      Download
                    </a>
                  </Button>
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

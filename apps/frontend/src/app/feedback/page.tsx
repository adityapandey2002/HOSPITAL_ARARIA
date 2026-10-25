import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SimpleFeedbackForm } from '@/components/feedback/SimpleFeedbackForm';

export const metadata: Metadata = {
  title: 'Share your feedback',
  description:
    'Share feedback about your visit to District Hospital Araria. Tell us what you liked and what we can improve.',
};

export default function FeedbackPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-700 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <MessageSquare className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Share your feedback</h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-primary-100">
              Tell us about your visit to District Hospital Araria. Your feedback helps us improve
              care for every patient.
            </p>
          </div>
        </section>

        <SimpleFeedbackForm />

        <div className="bg-white pb-12">
          <div className="container mx-auto px-4">
            <p className="mx-auto max-w-3xl text-center text-sm text-gray-500">
              Have a complaint?{' '}
              <Link
                href="/complaint"
                className="rounded font-medium text-primary-700 underline-offset-2 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                File a complaint
              </Link>{' '}
              | Hospital staff?{' '}
              <Link
                href="/admin/complaints"
                className="rounded font-medium text-primary-700 underline-offset-2 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Open the complaints admin panel
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

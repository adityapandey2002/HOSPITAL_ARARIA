'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

export const metadata = {
  title: 'Forgot Password | District Hospital Araria',
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
      handleApiResponse(response);
      toast.success('Reset instructions sent', {
        description: 'If an account exists for this email, you will receive password reset instructions.',
      });
      setEmail('');
    } catch (error: any) {
      toast.error('Reset failed', {
        description: error?.message || 'Please try again or contact the hospital help desk.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Forgot Password</h1>
            <p className="mt-2 text-primary-100">
              Enter your email address and we will send you instructions to reset your password.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <form
              onSubmit={handleSubmit}
              className="max-w-md mx-auto rounded-2xl border border-gray-100 bg-white p-8 shadow-sm space-y-4"
            >
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <a href="/login" className="text-primary-700 font-medium hover:text-primary-800">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

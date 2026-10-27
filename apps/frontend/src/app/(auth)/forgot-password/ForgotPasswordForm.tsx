'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { HOSPITAL, telHref } from '@/config/hospital';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
      handleApiResponse(response);
      toast.success('Request received', {
        description:
          'If an account exists for this email, the help desk will contact you with reset instructions.',
      });
      setEmail('');
    } catch (error) {
      toast.error('Request failed', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try again or contact the hospital help desk.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-balance font-heading text-h2 text-on-surface sm:text-h1">Forgot password</h1>
      <p className="mt-2 text-body text-on-surface-variant">
        Enter the email address linked to your account. Password resets are handled by the hospital
        help desk; submit your email and the help desk will contact you with reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={isSubmitting} fullWidth>
          Send reset instructions
        </Button>
      </form>

      <p className="mt-6 text-body-sm text-on-surface-variant">
        Remembered your password?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary-700 underline underline-offset-2 hover:text-primary-800"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-4 rounded-lg border border-outline-variant bg-surface-low p-3 text-body-sm text-on-surface-variant">
        No access to that email? Call reception on{' '}
        <a
          href={telHref(HOSPITAL.receptionPhone)}
          className="font-semibold text-primary-700 underline underline-offset-2"
        >
          {HOSPITAL.receptionPhone}
        </a>{' '}
        and ask for the portal help desk.
      </p>
    </div>
  );
}

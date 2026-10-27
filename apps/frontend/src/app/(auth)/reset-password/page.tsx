'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[@$!%*?&]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Reset failed', {
        description: error instanceof Error ? error.message : 'Invalid or expired token',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full">
        <h1 className="text-balance font-heading text-h2 text-on-surface sm:text-h1">Reset password</h1>
        <p className="mt-2 text-body text-on-surface-variant">
          A valid reset token is required. Password resets are handled by the hospital help desk; please
          contact them to obtain a reset link.
        </p>
        <p className="mt-6 text-body-sm text-on-surface-variant">
          <Link href="/login" className="font-semibold text-primary-700 underline underline-offset-2 hover:text-primary-800">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-balance font-heading text-h2 text-on-surface sm:text-h1">Reset password</h1>
      <p className="mt-2 text-body text-on-surface-variant">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="New password"
          type="password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" loading={isSubmitting} fullWidth>
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-body-sm text-on-surface-variant">
        <Link href="/login" className="font-semibold text-primary-700 underline underline-offset-2 hover:text-primary-800">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-body-sm text-on-surface-variant">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Hospital,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input } from '@dh-araria/ui/components';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Demo accounts only exist in seeded local databases. Keep them out of the
 * production bundle unless a deployment explicitly opts in with
 * NEXT_PUBLIC_SHOW_DEMO=true.
 */
const SHOW_DEMO_CREDENTIALS =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SHOW_DEMO === 'true';

/**
 * `useSearchParams()` opts a route into client-side rendering, so Next.js refuses
 * to prerender `/login` unless the hook is isolated behind a <Suspense> boundary.
 * The wrapper below is what the router renders; <LoginForm> bails out to the
 * client at runtime and the fallback is served for the static shell.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          id="main-content"
          className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 pt-32"
        >
          <p className="text-gray-500">Loading sign in…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestedRedirect =
    searchParams.get('redirect') || searchParams.get('callbackUrl');
  const expired = searchParams.get('expired') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success('Welcome back!', {
        description: 'You have been successfully logged in.',
      });

      // Hospital staff land on the complaint desk, not the patient appointment
      // page. An explicit ?redirect= still wins so deep links keep working.
      const isStaff = user.role === 'ADMIN' || user.role === 'STAFF';
      router.push(requestedRedirect || (isStaff ? '/admin/complaints' : '/appointments'));
      router.refresh();
    } catch (error) {
      toast.error('Login failed', {
        description: error instanceof Error ? error.message : 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 pt-32 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="mb-6 inline-flex items-center justify-center gap-3">
            <div className="rounded-lg bg-primary-600 p-2">
              <Hospital className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">District Hospital Araria</h1>
              <p className="text-xs text-gray-500">Government of Bihar</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        {expired && (
          <div className="border-warning-200 flex items-start gap-3 rounded-xl border bg-warning-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-600" />
            <div>
              <p className="text-warning-900 text-sm font-medium">Session Expired</p>
              <p className="text-sm text-warning-700">Please log in again to continue.</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            Sign In
          </Button>
        </form>

        {SHOW_DEMO_CREDENTIALS && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-4 text-gray-500">Demo Credentials</span>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-sm">
              <p className="mb-2 font-medium text-gray-900">For local testing only:</p>
              <div className="space-y-1 font-mono text-xs text-gray-600">
                <p>Email: demo@dhararia.gov.in</p>
                <p>Password: Demo@123</p>
              </div>
            </div>
          </>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Card, Button, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const NEW_PASSWORD_RULES =
  'At least 8 characters, with uppercase, lowercase, a number and a symbol.';

export default function AccountSecurityPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/security');
    }
  }, [isLoading, isAuthenticated, router]);

  const passwordRulesMet = (() => {
    if (newPassword.length < 8) return false;
    return (
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[@$!%*?&]/.test(newPassword)
    );
  })();

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword.trim()) {
      toast.error('Enter your current password.');
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 50) {
      toast.error('Choose a longer new password (8–50 characters).');
      return;
    }
    if (!passwordRulesMet) {
      toast.error('The new password needs uppercase, lowercase, a number and a symbol.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setChanging(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      handleApiResponse(response);
      toast.success('Password changed. Sign in again with your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      void router.push('/login');
    } catch (error: any) {
      toast.error('Could not change password', { description: error?.message });
    } finally {
      setChanging(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <p className="mx-auto max-w-2xl p-6 text-on-surface-variant">Checking access…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-6 w-6 text-primary-600" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Change password</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Only you can change your password. Your session ends after the change, so sign in
            again with the new password.
          </p>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <div className="relative">
            <Input
              label="Current password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 rounded text-on-surface-variant hover:text-on-surface"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              onClick={() => setShowCurrent((current) => !current)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              hint={NEW_PASSWORD_RULES}
              className={newPassword && !passwordRulesMet ? 'border-danger-600' : undefined}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 rounded text-on-surface-variant hover:text-on-surface"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
              onClick={() => setShowNew((current) => !current)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm new password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className={confirmPassword && newPassword && confirmPassword !== newPassword ? 'border-danger-600' : undefined}
              hint={
                newPassword && confirmPassword && newPassword !== confirmPassword
                  ? 'Passwords do not match.'
                  : undefined
              }
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 rounded text-on-surface-variant hover:text-on-surface"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              onClick={() => setShowConfirm((current) => !current)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div>
            <Button type="submit" loading={changing} disabled={changing || !passwordRulesMet}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function AccountProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    const base: Profile = { id: user.id, name: user.name, email: user.email, phone: user.phone };
    setProfile(base);
    setName(user.name);
    setPhone(user.phone ?? '');
  }, [user]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put('/users/profile', { name: name.trim(), phone: phone.trim() });
      toast.success('Profile saved');
      void handleApiResponse(response);
      await window.location.reload();
    } catch (error: any) {
      toast.error('Could not save profile', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <p className="mx-auto max-w-2xl p-6 text-on-surface-variant">Checking access…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Profile</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Name, phone and account details.</p>
      </div>

      <Card className="space-y-4 p-6">
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              hint="Shown on appointments and documents."
              required
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
            />
          </div>
          <Input
            label="Email"
            value={profile?.email ?? user?.email ?? ''}
            hint="Managed by the sign-in account."
            readOnly
          />
          <div>
            <Button type="submit" loading={saving} disabled={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

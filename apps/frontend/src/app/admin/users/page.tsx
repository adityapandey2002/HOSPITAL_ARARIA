'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const ROLES = ['PATIENT','DOCTOR','STAFF','ADMIN'];

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/users');
      const data = handleApiResponse(res);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(list as User[]);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (id: string, role: string) => {
    try {
      await api.put(`/users/${id}`, { role });
      toast.success('Role updated');
      await load();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await api.put(`/users/${u.id}`, { isActive: !u.isActive });
      toast.success('Status updated');
      await load();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Users</h1>
      {loading ? <p className="text-on-surface-variant">Loading…</p> : (
        <div className="space-y-3">
          {items.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-on-surface">{u.name}</p>
                  <p className="text-sm text-on-surface-variant">{u.email}</p>
                  <p className="text-xs font-medium text-primary-700">{u.role} · {u.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex gap-2">
                  <Select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}
                    options={ROLES.map((r) => ({ value: r, label: r }))} />
                  <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="text-on-surface-variant">No users.</p>}
        </div>
      )}
    </div>
  );
}

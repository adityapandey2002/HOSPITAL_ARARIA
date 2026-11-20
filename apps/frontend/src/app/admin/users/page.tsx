'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Select } from '@dh-araria/ui/components';
import { Search } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: 1,
        limit: 200,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.isActive = activeFilter === 'active';

      const res = await api.get<any>('/users', params);
      const data = handleApiResponse(res);
      const payload = data ?? {};
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      setItems(list as User[]);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 220);
    return () => clearTimeout(timer);
  }, [load]);

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

  const remove = async (u: User) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('User deleted');
      await load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Users</h1>
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="pl-10"
            />
          </div>
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[{ value: '', label: 'All roles' }, ...ROLES.map((r) => ({ value: r, label: r }))]}
          />
          <Select
            label="Status"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Card>
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
                  <Button size="sm" variant="outline" className="text-danger-600 hover:bg-danger-50" onClick={() => remove(u)}>
                    Delete
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

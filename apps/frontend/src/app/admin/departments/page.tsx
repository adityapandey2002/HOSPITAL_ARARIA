'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Building2, Check, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Dialog, Input, Textarea } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@dh-araria/shared';
import { formatDateTime } from '@dh-araria/shared/utils';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

interface Department {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  doctorCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const ICON_OPTIONS = [
  { value: 'Stethoscope', label: 'Stethoscope' },
  { value: 'HeartPulse', label: 'Heart pulse' },
  { value: 'Building2', label: 'Building' },
  { value: 'BedDouble', label: 'Bed' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'Pill', label: 'Pill' },
];

interface FormState {
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  isActive: boolean;
}

export default function AdminDepartmentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [items, setItems] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    icon: '',
    imageUrl: '',
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Department[]>('/departments/admin', {
        page,
        limit: PAGE_SIZE,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const payload =
        (handleApiResponse(response) as { data?: Department[]; meta?: { total?: number } }) ?? {};
      const data = payload.data ?? [];
      setItems(data);
      setTotal(payload.meta?.total ?? data.length);
    } catch (loadError: any) {
      setError(loadError?.message || 'Could not load departments.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    void load();
  }, [isAuthenticated, isAdmin, load]);

  const openEdit = (department: Department) => {
    setEditingId(department.id);
    setForm({
      name: department.name,
      description: department.description ?? '',
      icon: department.icon ?? '',
      imageUrl: department.imageUrl ?? '',
      isActive: department.isActive,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
      };
      if (editingId) {
        await api.put(`/departments/${editingId}`, body);
        toast.success('Department updated');
      } else {
        await api.post('/departments', body);
        toast.success('Department created');
      }
      setEditingId(null);
      setForm({ name: '', description: '', icon: '', imageUrl: '', isActive: true });
      void load();
    } catch (submitError: any) {
      toast.error('Save failed', { description: submitError?.message });
    }
  };

  const toggleActive = async (department: Department) => {
    try {
      await api.put(`/departments/${department.id}`, { isActive: !department.isActive });
      toast.success(department.isActive ? 'Deactivated' : 'Activated');
      void load();
    } catch (toggleError: any) {
      toast.error('Toggle failed', { description: toggleError?.message });
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this department?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted');
      void load();
    } catch (removeError: any) {
      toast.error('Delete failed', { description: removeError?.message });
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) return <p className="text-on-surface-variant">Checking access…</p>;
  if (!isAuthenticated || !isAdmin) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <Building2 className="mx-auto h-10 w-10 text-primary-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-on-surface">Administrator sign-in required</h1>
        <p className="mt-2 text-sm text-on-surface-variant">The departments screen is ADMIN only.</p>
        <Link
          href="/login?redirect=/admin/departments"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-5 font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Departments</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage every department, including inactive ones.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-danger-200 bg-danger-50 p-4 text-sm text-danger-900">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Retry
          </button>
        </Card>
      )}

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-low/60">
              <tr>
                <th className="px-4 py-3 font-medium text-on-surface-variant">Department</th>
                <th className="px-4 py-3 font-medium text-on-surface-variant">Status</th>
                <th className="px-4 py-3 font-medium text-on-surface-variant">Authors</th>
                <th className="px-4 py-3 font-medium text-on-surface-variant">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-low/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 max-w-[26rem] truncate text-xs text-on-surface-variant">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? 'success' : 'warning'} dot>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {typeof item.doctorCount === 'number' && (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {item.doctorCount} doctor{item.doctorCount === 1 ? '' : 's'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {item.updatedAt ? formatDateTime(item.updatedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-danger-600 hover:bg-danger-50"
                        onClick={() => remove(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-on-surface-variant">{total} departments</span>
        </div>
      )}

      <Dialog
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        title={editingId ? 'Edit department' : 'New department'}
        description="Deactivated departments stay visible here, so the health of the register is kept."
      >
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <div className="space-y-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="General Medicine"
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="One line describing the department"
              hint="Shown on the public Services page."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Icon name"
              value={form.icon}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
              placeholder="Stethoscope"
              hint={`Options: ${ICON_OPTIONS.map((option) => option.value).join(', ')}`}
            />
            <Input
              label="Image URL"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
              placeholder="https://…"
              hint="Hero image for the department detail page."
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="size-4 accent-primary-600"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            <span className="text-sm text-on-surface">Active — show this department to citizens</span>
          </label>
          <Button type="submit" size="sm">
            <Check className="h-3.5 w-3.5" />
            Save department
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

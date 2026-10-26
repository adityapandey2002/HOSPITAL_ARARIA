'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Button, Input } from '@dh-araria/ui/components';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { api, handleApiResponse } from '@/lib/api';

interface Department {
  id: string;
  name: string;
  isActive?: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  departments: { id: string; name: string }[];
  createdAt: string;
}

interface StaffForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  departmentIds: string[];
  isActive: boolean;
}

const EMPTY_FORM: StaffForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  departmentIds: [],
  isActive: true,
};

/** Mirrors the backend DTO so validation errors appear before the round trip. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const PHONE_PATTERN = /^[0-9+\-()\s]{7,20}$/;

type ModalState = { mode: 'create' } | { mode: 'edit'; member: StaffMember } | null;

export function StaffAccessPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [staffResponse, departmentResponse] = await Promise.all([
        api.get<StaffMember[]>('/admin/staff'),
        api.get<Department[]>('/departments', {
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      ]);

      setStaff(handleApiResponse(staffResponse) ?? []);
      setDepartments(
        (handleApiResponse(departmentResponse) ?? []).filter(
          (department) => department.isActive !== false
        )
      );
    } catch (error) {
      setLoadError(getErrorMessage(error, 'We could not load staff accounts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadData();
  }, [isAdmin, loadData]);

  // Escape closes the form, matching the other admin dialogs.
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) setModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, submitting]);

  const activeCount = useMemo(() => staff.filter((member) => member.isActive).length, [staff]);
  const coveredDepartments = useMemo(() => {
    const ids = new Set<string>();
    for (const member of staff) {
      for (const department of member.departments) ids.add(department.id);
    }
    return ids.size;
  }, [staff]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal({ mode: 'create' });
  };

  const openEdit = (member: StaffMember) => {
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      password: '',
      departmentIds: member.departments.map((department) => department.id),
      isActive: member.isActive,
    });
    setFormErrors({});
    setModal({ mode: 'edit', member });
  };

  const toggleDepartment = (departmentId: string) => {
    setForm((current) => ({
      ...current,
      departmentIds: current.departmentIds.includes(departmentId)
        ? current.departmentIds.filter((id) => id !== departmentId)
        : [...current.departmentIds, departmentId],
    }));
    setFormErrors((current) => ({ ...current, departmentIds: '' }));
  };

  const validate = (mode: 'create' | 'edit'): boolean => {
    const errors: Record<string, string> = {};

    if (form.name.trim().length < 2) errors.name = 'Enter the staff member’s full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }

    const passwordRequired = mode === 'create';
    if (passwordRequired && form.password.length === 0) {
      errors.password = 'Set an initial password';
    } else if (form.password.length > 0) {
      if (form.password.length < 8) {
        errors.password = 'Use at least 8 characters';
      } else if (!PASSWORD_PATTERN.test(form.password)) {
        errors.password =
          'Include an uppercase letter, a lowercase letter, a number, and a special character';
      }
    }

    if (form.departmentIds.length === 0) {
      errors.departmentIds = 'Select at least one department';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal) return;

    const mode = modal.mode;
    if (!validate(mode)) return;

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      departmentIds: form.departmentIds,
    };
    if (form.password) payload.password = form.password;
    if (mode === 'edit') payload.isActive = form.isActive;

    setSubmitting(true);
    try {
      if (mode === 'create') {
        await api.post('/admin/staff', payload);
        toast.success('Staff account created', {
          description: `${form.email.trim()} can now sign in and manage complaints for the selected departments.`,
        });
      } else {
        await api.patch(`/admin/staff/${modal.member.id}`, payload);
        toast.success('Staff account updated');
      }
      setModal(null);
      await loadData();
    } catch (error) {
      toast.error(mode === 'create' ? 'Could not create the account' : 'Could not update the account', {
        description: getErrorMessage(error, 'Please check the details and try again.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    setBusyId(member.id);
    try {
      await api.patch(`/admin/staff/${member.id}`, { isActive: !member.isActive });
      toast.success(member.isActive ? 'Account deactivated' : 'Account reactivated', {
        description: member.isActive
          ? `${member.name} can no longer sign in, but their history is kept.`
          : `${member.name} can sign in again with their existing password.`,
      });
      await loadData();
    } catch (error) {
      toast.error('Could not change the account status', {
        description: getErrorMessage(error, 'Please try again.'),
      });
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 text-gray-600">
        <RefreshCw className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
        Checking your account…
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? 'Administrator access required' : 'Sign in required'}
        </h2>
        <p className="mt-2 text-gray-600">
          {user
            ? 'Only the Hospital Manager can create staff accounts and change department access. Your complaint desk is still available.'
            : 'Sign in with an administrator account to manage staff and department access.'}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={user ? '/admin/complaints' : '/login?redirect=/admin/staff'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            {user ? 'Go to the complaint desk' : 'Sign in'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff &amp; Department Access</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create a staff login, choose the departments whose complaints it can see, and update
            those permissions at any time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void loadData()} loading={loading}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button type="button" onClick={openCreate}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add staff member
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={Users} label="Staff accounts" value={String(staff.length)} />
        <SummaryCard icon={CheckCircle} label="Active" value={String(activeCount)} />
        <SummaryCard
          icon={KeyRound}
          label="Departments covered"
          value={`${coveredDepartments}/${departments.length}`}
        />
      </div>

      {loadError && (
        <p
          role="alert"
          className="border-danger-200 text-danger-800 flex items-start gap-2 rounded-xl border bg-danger-50 p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{loadError}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadData()}>
            Retry
          </Button>
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading && staff.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500" role="status">
            Loading staff accounts…
          </p>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <Users className="mx-auto mb-3 h-9 w-9 text-gray-400" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900">No department staff yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
              Add a staff member with their email, a password, and the departments they should
              handle. They will see only those departments’ complaints.
            </p>
            <Button type="button" className="mt-5" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add the first staff member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Staff accounts and the departments whose complaints they can manage
              </caption>
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Staff member
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Departments
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((member) => (
                  <tr key={member.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="break-all text-xs text-gray-500">{member.email}</p>
                          {member.phone && (
                            <p className="text-xs text-gray-500">{member.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {member.departments.length === 0 ? (
                        <span className="text-xs text-danger-700">No access</span>
                      ) : (
                        <ul className="flex max-w-xs flex-wrap gap-1.5">
                          {member.departments.map((department) => (
                            <li key={department.id}>
                              <span className="inline-flex rounded-md bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 ring-1 ring-inset ring-primary-100">
                                {department.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          member.isActive
                            ? 'inline-flex rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700'
                            : 'inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700'
                        }
                      >
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(member)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Manage
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={busyId === member.id}
                          onClick={() => void toggleActive(member)}
                          className={member.isActive ? 'text-danger-700' : 'text-success-700'}
                        >
                          {member.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Administrators always see every department and are not listed here. A staff member with no
        department access cannot see any complaints until a department is assigned.
      </p>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && setModal(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-form-title"
            className="relative my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="staff-form-title" className="text-xl font-bold text-gray-900">
                  {modal.mode === 'create' ? 'Add staff member' : `Manage ${modal.member.name}`}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {modal.mode === 'create'
                    ? 'The account is created with the STAFF role and is limited to the departments you select.'
                    : 'Change the departments this account can see, reset its password, or deactivate it.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setModal(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close staff form"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full name *"
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  setFormErrors((current) => ({ ...current, name: '' }));
                }}
                error={formErrors.name}
                autoComplete="name"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email address *"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm({ ...form, email: event.target.value });
                    setFormErrors((current) => ({ ...current, email: '' }));
                  }}
                  error={formErrors.email}
                  autoComplete="email"
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => {
                    setForm({ ...form, phone: event.target.value });
                    setFormErrors((current) => ({ ...current, phone: '' }));
                  }}
                  error={formErrors.phone}
                  autoComplete="tel"
                />
              </div>

              <Input
                label={modal.mode === 'create' ? 'Initial password *' : 'Reset password (optional)'}
                type="password"
                value={form.password}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  setFormErrors((current) => ({ ...current, password: '' }));
                }}
                error={formErrors.password}
                hint="At least 8 characters with uppercase, lowercase, a number, and a special character."
                autoComplete="new-password"
              />

              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-gray-700">
                  Department access *
                </legend>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2">
                  {departments.length === 0 ? (
                    <p className="text-sm text-gray-500">No active departments available.</p>
                  ) : (
                    departments.map((department) => (
                      <label
                        key={department.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={form.departmentIds.includes(department.id)}
                          onChange={() => toggleDepartment(department.id)}
                        />
                        <span>{department.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {formErrors.departmentIds && (
                  <p className="form-error" role="alert">
                    {formErrors.departmentIds}
                  </p>
                )}
              </fieldset>

              {modal.mode === 'edit' && (
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                  />
                  <span className="text-sm text-gray-700">
                    Account is active and may sign in
                  </span>
                </label>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {modal.mode === 'create' ? 'Create account' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

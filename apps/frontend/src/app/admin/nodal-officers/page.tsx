'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  User,
  Shield,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button, Input, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { cn } from '@dh-araria/shared/utils';
import { toast } from 'sonner';

interface DepartmentAccess {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  departmentId: string;
  departmentName: string;
  grantedBy?: string | null;
  createdAt: Date;
}

interface Department {
  id: string;
  name: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminNodalOfficersPage() {
  const [grants, setGrants] = useState<DepartmentAccess[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    departmentId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadGrants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<DepartmentAccess[]>('/admin/department-access');
      const data = handleApiResponse(response);
      setGrants(data as DepartmentAccess[]);
    } catch (error: any) {
      toast.error('Failed to load access grants', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await api.get<Department[]>('/departments', {
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const data = handleApiResponse(response);
      setDepartments(data as Department[]);
    } catch {
      // Non-fatal
    }
  }, []);

  const loadStaffUsers = useCallback(async () => {
    try {
      const response = await api.get<StaffUser[]>('/users', {
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const data = handleApiResponse(response);
      const staff = (data as StaffUser[]).filter(
        (u: StaffUser) => u.role === 'ADMIN' || u.role === 'STAFF'
      );
      setStaffUsers(staff);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void loadGrants();
    void loadDepartments();
    void loadStaffUsers();
  }, [loadGrants, loadDepartments, loadStaffUsers]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.userId) errors.userId = 'Please select a staff member';
    if (!formData.departmentId) errors.departmentId = 'Please select a department';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await api.post<DepartmentAccess>('/admin/department-access', {
        userId: formData.userId,
        departmentId: formData.departmentId,
      });
      handleApiResponse(response);
      toast.success('Nodal officer assigned successfully');
      setOpenForm(false);
      setFormData({ userId: '', departmentId: '' });
      setFormErrors({});
      void loadGrants();
    } catch (error: any) {
      toast.error('Failed to assign nodal officer', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this department access?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/department-access/${id}`);
      toast.success('Department access revoked successfully');
      void loadGrants();
    } catch (error: any) {
      toast.error('Failed to revoke access', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nodal Officers</h2>
          <p className="text-sm text-gray-600">
            Nominate staff members as department nodal officers who can view and update
            complaints for their department.
          </p>
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Assign Access
        </Button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mt-6">
          {grants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
              <h3 className="text-lg font-medium text-gray-900">No nodal officers assigned</h3>
              <p className="text-sm text-gray-600 mt-1">
                Assign staff members to departments so they can manage complaints.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-medium text-gray-600">Staff Member</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Granted At</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grants.map((grant) => (
                    <tr key={grant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {grant.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{grant.userName}</p>
                            <p className="text-xs text-gray-500">{grant.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{grant.departmentName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                          <Shield className="h-3 w-3" />
                          {grant.userEmail.split('@')[0].toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(grant.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevoke(grant.id)}
                          disabled={deletingId === grant.id}
                          className="text-danger-600 hover:bg-danger-50"
                        >
                          {deletingId === grant.id ? (
                            <AlertCircle className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Access Modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenForm(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Assign Department Access</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenForm(false)}
              >
                <User className="h-3 w-3" />
                Cancel
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Staff Member *</label>
                <Select
                  name="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  options={staffUsers.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.email}) - ${u.role}`,
                  }))}
                  placeholder="Select a staff member"
                  error={formErrors.userId}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Department *</label>
                <Select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  placeholder="Select a department"
                  error={formErrors.departmentId}
                />
              </div>

              <p className="text-xs text-gray-500">
                The selected staff member will be able to view and update complaints for this
                department only.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Assign Access
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

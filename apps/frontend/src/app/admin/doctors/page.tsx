'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  User,
  Search,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import { Button, Input, Select } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { cn } from '@dh-araria/shared/utils';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  rating: number;
  reviewCount: number;
  departmentId?: string | null;
  departmentName?: string | null;
  languages: string[];
  bio?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  id: string;
  name: string;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    departmentId: '',
    bio: '',
    hprId: '',
    consultationFee: '',
    languages: 'English, Hindi',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 100, sortBy: 'name', sortOrder: 'asc' };
      if (departmentFilter) params.departmentId = departmentFilter;

      const response = await api.get<Doctor[]>('/admin/doctors', params);
      const data = handleApiResponse(response);
      setDoctors(data as Doctor[]);
    } catch (error: any) {
      toast.error('Failed to load doctors', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await api.get<Department[]>('/departments', {
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const data = handleApiResponse(response);
      setDepartments((data ?? []) as Department[]);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void loadDoctors();
    void loadDepartments();
  }, [loadDoctors, loadDepartments]);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.specialization.trim()) errors.specialization = 'Specialization is required';
    if (!formData.qualification.trim()) errors.qualification = 'Qualification is required';
    if (!formData.experience.trim()) errors.experience = 'Experience is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await api.post<Doctor>('/admin/doctors', {
        ...formData,
        experience: Number(formData.experience),
        consultationFee: formData.consultationFee
          ? Number(formData.consultationFee)
          : undefined,
        languages: formData.languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      });
      handleApiResponse(response);
      toast.success('Doctor added successfully');
      setOpenForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        qualification: '',
        experience: '',
        departmentId: '',
        bio: '',
        hprId: '',
        consultationFee: '',
        languages: 'English, Hindi',
      });
      setFormErrors({});
      void loadDoctors();
    } catch (error: any) {
      toast.error('Failed to add doctor', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this doctor?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success('Doctor removed successfully');
      void loadDoctors();
    } catch (error: any) {
      toast.error('Failed to remove doctor', {
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
          <h2 className="text-2xl font-bold text-gray-900">Manage Doctors</h2>
          <p className="text-sm text-gray-600">
            Add, edit, and remove doctors across departments.
          </p>
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search doctors by name, specialization, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            label="Department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="All departments"
          />
          <Button onClick={() => void loadDoctors()} loading={loading} size="sm">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        <div className="mt-6">
          {filteredDoctors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-gray-500">
                {loading ? 'Loading doctors…' : 'No doctors found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-medium text-gray-600">Doctor</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Specialization</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Experience</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Fee</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Rating</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {doctor.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-xs text-gray-500">
                              {doctor.languages?.join(', ') || 'English, Hindi'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {doctor.specialization}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {doctor.departmentName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {doctor.experience} years
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        ₹{doctor.consultationFee}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {doctor.rating} / 5
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doctor.id)}
                          disabled={deletingId === doctor.id}
                          className="text-danger-600 hover:bg-danger-50"
                        >
                          {deletingId === doctor.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
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

      {/* Add Doctor Modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenForm(false)} />
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Doctor</h3>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={formErrors.name}
                    placeholder="Dr. Rajesh Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={formErrors.email}
                    placeholder="doctor@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone *</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={formErrors.phone}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Specialization *</label>
                  <Input
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    error={formErrors.specialization}
                    placeholder="Cardiology"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Qualification *</label>
                  <Input
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    error={formErrors.qualification}
                    placeholder="MBBS, MD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Experience (years) *</label>
                  <Input
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    error={formErrors.experience}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Department *</label>
                  <Select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    placeholder="Select department"
                    error={formErrors.departmentId}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Consultation Fee (₹)</label>
                  <Input
                    name="consultationFee"
                    type="number"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">HPR ID</label>
                  <Input
                    name="hprId"
                    value={formData.hprId}
                    onChange={handleInputChange}
                    placeholder="ABDM Health Professional ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Languages</label>
                <Input
                  name="languages"
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder="English, Hindi, Bengali"
                  hint="Comma-separated languages"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description of the doctor's expertise..."
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Add Doctor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, Camera, CheckCircle, Image, Send, X } from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import type { Department } from '@dh-araria/shared/types';
import { api, handleApiResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/feedback';
import { useAuth } from '@/context/AuthContext';

type FieldErrors = Partial<Record<'departmentId' | 'name' | 'complaint', string>>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ComplaintFormProps {
  /** Preselected department for direct links. */
  initialDepartmentId?: string;
}

export function ComplaintForm({ initialDepartmentId }: ComplaintFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState(initialDepartmentId ?? '');
  const [complaint, setComplaint] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated } = useAuth();

  // Auto-fill name from logged-in user's profile
  useEffect(() => {
    if (isAuthenticated && user?.name && !name) {
      setName(user.name);
    }
  }, [isAuthenticated, user?.name, name]);

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    setDepartmentsError(null);

    try {
      const response = await api.get<Department[]>('/departments', {
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      const active = (handleApiResponse(response) ?? []).filter(
        (department) => department.isActive !== false
      );
      setDepartments(active);
    } catch (error) {
      setDepartmentsError(
        getErrorMessage(error, 'We could not load the department list. Please try again.')
      );
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (submitted) {
      successHeadingRef.current?.focus();
    }
  }, [submitted]);

  const clearError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Please enter your name.';
    }
    if (!departmentId) {
      errors.departmentId = 'Please select a department.';
    }
    if (!complaint.trim()) {
      errors.complaint = 'Please describe your complaint.';
    }

    if (name.trim().length > 120) {
      errors.name = 'Name must be 120 characters or fewer.';
    }
    if (complaint.trim().length > 5000) {
      errors.complaint = 'Complaint must be 5000 characters or fewer.';
    }

    return errors;
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageError(null);

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please upload a JPEG, PNG or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be smaller than 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      // Convert the image to a base64 data URL so it can be sent as a string
      // in the JSON payload. For production, this would be uploaded to object
      // storage and the URL stored instead.
      imageUrl = imagePreview!;
    }

    const payload = {
      name: name.trim(),
      departmentId,
      complaint: complaint.trim(),
      ...(imageUrl ? { imageUrl } : {}),
    };

    setIsSubmitting(true);
    try {
      const response = await api.post<{ id: string }>('/complaints', payload);
      const created = handleApiResponse(response);

      setReferenceId(created?.id ?? null);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, 'We could not submit your complaint. Please try again in a moment.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewComplaint = () => {
    setSubmitted(false);
    setReferenceId(null);
    setComplaint('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageError(null);
    setFieldErrors({});
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Re-fill name from auth if logged in
    if (isAuthenticated && user?.name) {
      setName(user.name);
    } else {
      setName('');
    }

    window.setTimeout(() => document.getElementById('complaint-name')?.focus(), 0);
  };

  if (submitted) {
    return (
      <section className="bg-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="border-success-200 mx-auto max-w-2xl rounded-2xl border bg-success-50 p-6 text-center sm:p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
              <CheckCircle className="h-9 w-9 text-success-600" aria-hidden="true" />
            </div>

            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-gray-900 focus:outline-none sm:text-3xl"
            >
              Complaint Submitted
            </h2>
            <p className="mt-3 text-gray-700">
              Your complaint has been recorded and forwarded to the concerned department. The
              hospital team will review it and get back to you.
            </p>

            {referenceId && (
              <div className="border-success-200 mt-6 rounded-xl border bg-white p-5">
                <p className="text-sm font-medium text-gray-600">Your complaint reference ID</p>
                <p className="mt-1 break-all font-mono text-lg font-bold text-primary-700">
                  {referenceId}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Keep this reference to track the status of your complaint.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={handleNewComplaint} variant="outline">
                File Another Complaint
              </Button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-primary-700 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Back to the hospital home page
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {departmentsLoading ? (
            <div
              className="rounded-2xl border border-gray-100 bg-gray-50 p-10 text-center"
              role="status"
              aria-live="polite"
            >
              <AlertCircle className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
              <p className="text-gray-600">Loading departments…</p>
            </div>
          ) : departmentsError ? (
            <div className="border-danger-200 rounded-2xl border bg-danger-50 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-8 w-8 text-danger-600" aria-hidden="true" />
              <h2 className="text-danger-900 text-lg font-semibold">
                We could not load the complaint form
              </h2>
              <p className="text-danger-800 mt-2">{departmentsError}</p>
              <Button
                type="button"
                variant="outline"
                className="border-danger-300 mt-5 text-danger-700 hover:bg-danger-100"
                onClick={() => void loadDepartments()}
              >
                Try again
              </Button>
            </div>
          ) : departments.length === 0 ? (
            <div className="border-warning-200 rounded-2xl border bg-warning-50 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-8 w-8 text-warning-600" aria-hidden="true" />
              <h2 className="text-warning-900 text-lg font-semibold">
                Complaints are not open right now
              </h2>
              <p className="text-warning-800 mt-2">
                No departments are available for complaints at the moment.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="relative space-y-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  File a Complaint
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Fields marked <span className="text-danger-600">*</span> are required. You can
                  describe your complaint in writing, or attach a photo taken with your camera.
                </p>
              </div>

              {Object.keys(fieldErrors).length > 0 && (
                <div
                  ref={errorSummaryRef}
                  tabIndex={-1}
                  role="alert"
                  className="border-danger-200 text-danger-800 rounded-xl border bg-danger-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-danger-500"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Please check the highlighted fields below.
                  </p>
                </div>
              )}

              {/* Name */}
              <Input
                id="complaint-name"
                label="Name *"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setName(event.target.value);
                  clearError('name');
                }}
                maxLength={120}
                placeholder="Your full name"
                autoComplete="name"
                error={fieldErrors.name}
                required
                readOnly={isAuthenticated && Boolean(user?.name)}
              />
              {isAuthenticated && user?.name && (
                <p className="mt-1 text-xs text-gray-500">
                  Auto-filled from your account.{' '}
                  <a
                    href="/login"
                    className="text-primary-700 font-medium hover:text-primary-800"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/login';
                    }}
                  >
                    Use a different name
                  </a>
                </p>
              )}

              {/* Department dropdown */}
              <Select
                id="complaint-department"
                label="Department *"
                value={departmentId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  setDepartmentId(event.target.value);
                  clearError('departmentId');
                }}
                options={departments.map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
                placeholder="Select the department"
                error={fieldErrors.departmentId}
                hint="Choose the department your complaint is about."
                autoComplete="off"
                required
              />

              {/* Complaint description */}
              <Textarea
                id="complaint-description"
                label="Your complaint *"
                value={complaint}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                  setComplaint(event.target.value);
                  clearError('complaint');
                }}
                rows={6}
                placeholder="Describe what happened, when, where, and who was involved. Include any relevant details…"
                hint="Maximum 5000 characters."
                error={fieldErrors.complaint}
                required
              />

              {/* Camera / photo option */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-600" aria-hidden="true" />
                  <h3 className="text-base font-semibold text-gray-900">Add a photo (optional)</h3>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  You can take a picture with your camera or upload an image to support your
                  complaint. JPEG, PNG or WebP, up to 5 MB.
                </p>

                {imagePreview ? (
                  <div className="relative inline-block mb-3">
                    <img
                      src={imagePreview}
                      alt="Complaint photo preview"
                      className="rounded-lg border border-gray-300 max-w-[300px] max-h-[300px] object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2"
                    >
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                ) : null}

                {imageError && (
                  <p className="mb-3 text-sm text-danger-600" role="alert">
                    <AlertCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {imageError}
                  </p>
                )}

                <label className="block cursor-pointer">
                  <input
                    ref={fileInputRef}
                    id="complaint-image"
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    capture="environment"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={Boolean(imageFile)}
                  >
                    {imageFile ? 'Photo attached' : <><Camera className="mr-2 h-4 w-4" /> Take or upload photo</>}
                  </Button>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  On mobile, this opens your camera. You can also choose an existing image from
                  your gallery.
                </p>
              </div>

              {submitError && (
                <div className="border-danger-200 rounded-xl border bg-danger-50 p-4" role="alert">
                  <p className="text-danger-800 flex items-start gap-2 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  Your complaint will be reviewed by the hospital administration.
                </p>
                <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit complaint
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

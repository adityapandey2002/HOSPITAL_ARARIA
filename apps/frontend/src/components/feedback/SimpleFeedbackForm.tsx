'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';
import type { Department } from '@dh-araria/shared/types';
import { Button, Input, Textarea } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/feedback';

type FieldErrors = Partial<Record<'departmentIds' | 'name' | 'likedMost' | 'suggestion', string>>;

interface SimpleFeedbackFormProps {
  /** Preselected department for shareable/QR links (`/feedback/<id>`). */
  initialDepartmentId?: string;
}

/** Max departments a citizen can select. */
const MAX_DEPARTMENTS = 5;

export function SimpleFeedbackForm({ initialDepartmentId }: SimpleFeedbackFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<Set<string>>(
    initialDepartmentId ? new Set([initialDepartmentId]) : new Set()
  );
  const [likedMost, setLikedMost] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

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
    if (selectedDepartmentIds.size === 0) {
      errors.departmentIds = 'Please select at least one department you visited.';
    }
    if (!likedMost.trim()) {
      errors.likedMost = 'Please tell us what you liked the most.';
    }
    if (!suggestion.trim()) {
      errors.suggestion = 'Please tell us what you would like to suggest.';
    }

    if (name.trim().length > 120) {
      errors.name = 'Name must be 120 characters or fewer.';
    }
    if (likedMost.trim().length > 1000) {
      errors.likedMost = 'Please keep this under 1000 characters.';
    }
    if (suggestion.trim().length > 1000) {
      errors.suggestion = 'Please keep this under 1000 characters.';
    }

    return errors;
  };

  const toggleDepartment = (id: string) => {
    setSelectedDepartmentIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size >= MAX_DEPARTMENTS) {
        // Do nothing — limit reached.
        return current;
      } else {
        next.add(id);
      }
      return next;
    });
    clearError('departmentIds');
  };

  const isSelected = (id: string) => selectedDepartmentIds.has(id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }

    const payload = {
      departmentId: Array.from(selectedDepartmentIds)[0] ?? '',
      departmentIds: Array.from(selectedDepartmentIds),
      likedMost: likedMost.trim(),
      suggestion: suggestion.trim(),
      name: name.trim(),
    };

    setIsSubmitting(true);
    try {
      const response = await api.post<{ id: string }>('/feedback', payload);
      const created = handleApiResponse(response);

      setReferenceId(created?.id ?? null);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, 'We could not submit your feedback. Please try again in a moment.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setSubmitted(false);
    setReferenceId(null);
    setName('');
    setSelectedDepartmentIds(new Set());
    setLikedMost('');
    setSuggestion('');
    setFieldErrors({});
    setSubmitError(null);

    window.setTimeout(() => document.getElementById('feedback-name')?.focus(), 0);
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
              Thank you for your feedback
            </h2>
            <p className="mt-3 text-gray-700">
              Your response has been recorded. It will help District Hospital Araria improve its
              services for everyone.
            </p>

            {referenceId && (
              <div className="border-success-200 mt-6 rounded-xl border bg-white p-5">
                <p className="text-sm font-medium text-gray-600">Your reference ID</p>
                <p className="mt-1 break-all font-mono text-lg font-bold text-primary-700">
                  {referenceId}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Keep this reference if you need to follow up with the hospital.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={handleSubmitAnother} variant="outline">
                Submit another response
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
                We could not load the feedback form
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
                Feedback is not open right now
              </h2>
              <p className="text-warning-800 mt-2">
                No departments are available for feedback at the moment.
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
                  Tell us about your visit
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Fields marked <span className="text-danger-600">*</span> are required. Your
                  response helps District Hospital Araria improve care for every patient.
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
                id="feedback-name"
                label="Name *"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setName(event.target.value);
                  clearError('name');
                }}
                maxLength={120}
                placeholder="Your name"
                autoComplete="name"
                error={fieldErrors.name}
                required
              />

              {/* Departments (multiple select) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Departments visited * <span className="text-danger-600 ml-1">(select one or more)</span>
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  Select all departments you visited during this trip. Maximum {MAX_DEPARTMENTS}.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {departments.map((department) => (
                    <label
                      key={department.id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                        isSelected(department.id)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
                      )}
                      onClick={() => toggleDepartment(department.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(department.id)}
                        onChange={() => toggleDepartment(department.id)}
                        aria-label={department.name}
                        readOnly
                        className="h-4 w-4 shrink-0"
                      />
                      {department.name}
                    </label>
                  ))}
                </div>
                {fieldErrors.departmentIds && (
                  <p className="mt-1.5 text-sm text-danger-600" role="alert">
                    {fieldErrors.departmentIds}
                  </p>
                )}
              </div>

              {/* What he liked the most */}
              <Textarea
                id="feedback-liked-most"
                label="What did you like the most? *"
                value={likedMost}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                  setLikedMost(event.target.value);
                  clearError('likedMost');
                }}
                rows={4}
                placeholder="For example: the staff were kind, the doctor explained everything clearly, the pharmacy was quick…"
                hint="Maximum 1000 characters."
                error={fieldErrors.likedMost}
                required
              />

              {/* What he wants to suggest */}
              <Textarea
                id="feedback-suggestion"
                label="What would you like to suggest? *"
                value={suggestion}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                  setSuggestion(event.target.value);
                  clearError('suggestion');
                }}
                rows={4}
                placeholder="For example: reduce waiting time, improve signage, more seating in the waiting area…"
                hint="Maximum 1000 characters."
                error={fieldErrors.suggestion}
                required
              />

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
                  Your feedback helps District Hospital Araria improve care for everyone.
                </p>
                <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit feedback
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

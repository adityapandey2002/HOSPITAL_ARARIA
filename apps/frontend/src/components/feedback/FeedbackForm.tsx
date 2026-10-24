'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, CheckCircle, Info, MessageSquare, RefreshCw, Send } from 'lucide-react';
import Link from 'next/link';
import type { Department } from '@dh-araria/shared/types';
import { FeedbackServiceArea } from '@dh-araria/shared/types';
import { FEEDBACK_SERVICE_AREA_LABELS } from '@dh-araria/shared/constants';
import { isValidEmail } from '@dh-araria/shared/utils';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import { api, handleApiResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/feedback';
import { StarRatingInput } from './RatingStars';

type DepartmentOption = Pick<Department, 'id' | 'name' | 'isActive'>;

type FieldName = 'departmentId' | 'serviceArea' | 'rating' | 'name' | 'phone' | 'email' | 'comment';

type FieldErrors = Partial<Record<FieldName, string>>;

interface CreateFeedbackPayload {
  departmentId: string;
  serviceArea: FeedbackServiceArea;
  rating: number;
  cleanliness: number | null;
  staffBehaviour: number | null;
  waitTime: number | null;
  comment?: string;
  name?: string;
  phone?: string;
  email?: string;
  /** Honeypot. Real citizens never see or fill this field. */
  website: string;
}

interface FeedbackFormProps {
  /** Preselected department for shareable/QR links (`/feedback/<id>`). */
  initialDepartmentId?: string;
}

const SERVICE_AREA_OPTIONS = Object.values(FeedbackServiceArea).map((area) => ({
  value: area,
  label: FEEDBACK_SERVICE_AREA_LABELS[area] ?? area,
}));

/** Mirrors the backend `CreateFeedbackDto` phone pattern. */
const PHONE_PATTERN = /^[0-9+\-()\s]{7,20}$/;

export function FeedbackForm({ initialDepartmentId }: FeedbackFormProps) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [linkDepartmentMissing, setLinkDepartmentMissing] = useState(false);

  const [departmentId, setDepartmentId] = useState(initialDepartmentId ?? '');
  const [serviceArea, setServiceArea] = useState<FeedbackServiceArea | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [cleanliness, setCleanliness] = useState<number | null>(null);
  const [staffBehaviour, setStaffBehaviour] = useState<number | null>(null);
  const [waitTime, setWaitTime] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

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
    setLinkDepartmentMissing(false);

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

      if (
        initialDepartmentId &&
        !active.some((department) => department.id === initialDepartmentId)
      ) {
        setLinkDepartmentMissing(true);
        setDepartmentId((current) => (current === initialDepartmentId ? '' : current));
      }
    } catch (error) {
      setDepartmentsError(
        getErrorMessage(error, 'We could not load the department list. Please try again.')
      );
    } finally {
      setDepartmentsLoading(false);
    }
  }, [initialDepartmentId]);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (submitted) {
      successHeadingRef.current?.focus();
    }
  }, [submitted]);

  const clearError = (field: FieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!departmentId) {
      errors.departmentId = 'Please select the department you visited.';
    }
    if (!serviceArea) {
      errors.serviceArea = 'Please select the service area.';
    }
    if (rating === null) {
      errors.rating = 'Please choose an overall rating.';
    }
    if (name.trim().length > 120) {
      errors.name = 'Name must be 120 characters or fewer.';
    }
    if (comment.length > 2000) {
      errors.comment = 'Comment must be 2000 characters or fewer.';
    }

    const emailValue = email.trim();
    if (emailValue && !isValidEmail(emailValue)) {
      errors.email = 'Enter a valid email address.';
    }

    const phoneValue = phone.trim();
    if (phoneValue && !PHONE_PATTERN.test(phoneValue)) {
      errors.phone = 'Enter a valid phone number (7–20 digits, spaces, +, - or brackets).';
    }

    return errors;
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

    if (!departmentId || !serviceArea || rating === null) {
      return;
    }

    const payload: CreateFeedbackPayload = {
      departmentId,
      serviceArea,
      rating,
      cleanliness,
      staffBehaviour,
      waitTime,
      comment: comment.trim() || undefined,
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website,
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
    setRating(null);
    setCleanliness(null);
    setStaffBehaviour(null);
    setWaitTime(null);
    setServiceArea('');
    setComment('');
    setName('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setFieldErrors({});
    setSubmitError(null);

    window.setTimeout(() => document.getElementById('feedback-department')?.focus(), 0);
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
              <RefreshCw
                className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600"
                aria-hidden="true"
              />
              <p className="text-gray-600">Loading departments…</p>
            </div>
          ) : departmentsError ? (
            <div
              className="border-danger-200 rounded-2xl border bg-danger-50 p-8 text-center"
              role="alert"
            >
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
              <Info className="mx-auto mb-4 h-8 w-8 text-warning-600" aria-hidden="true" />
              <h2 className="text-warning-900 text-lg font-semibold">
                Feedback is not open right now
              </h2>
              <p className="text-warning-800 mt-2">
                No departments are available for feedback at the moment. Please contact the hospital
                help desk, or use the{' '}
                <Link href="/contact" className="font-medium underline underline-offset-2">
                  contact page
                </Link>{' '}
                to reach us.
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
                  response is anonymous unless you choose to add contact details.
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

              {linkDepartmentMissing && (
                <div
                  className="border-warning-200 text-warning-900 rounded-xl border bg-warning-50 p-4 text-sm"
                  role="status"
                >
                  <p className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>
                      The department in this link is no longer available. Please choose a department
                      below.
                    </span>
                  </p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  id="feedback-department"
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
                  placeholder="Select a department"
                  error={fieldErrors.departmentId}
                  hint="Choose the department you visited."
                  autoComplete="off"
                />

                <Select
                  id="feedback-service-area"
                  label="Service area *"
                  value={serviceArea}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    setServiceArea(event.target.value as FeedbackServiceArea | '');
                    clearError('serviceArea');
                  }}
                  options={SERVICE_AREA_OPTIONS}
                  placeholder="Select a service area"
                  error={fieldErrors.serviceArea}
                  hint="For example, OPD consultation or the pharmacy."
                  autoComplete="off"
                />
              </div>

              <StarRatingInput
                name="rating"
                legend="Overall experience"
                value={rating}
                onChange={(value) => {
                  setRating(value);
                  clearError('rating');
                }}
                required
                error={fieldErrors.rating}
                hint="Rate your overall experience at the hospital."
              />

              <div>
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Rate specific aspects</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Optional. Choose “Skip” for anything you would rather not rate.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <StarRatingInput
                    name="cleanliness"
                    legend="Cleanliness"
                    value={cleanliness}
                    onChange={setCleanliness}
                    allowSkip
                    size="sm"
                  />
                  <StarRatingInput
                    name="staffBehaviour"
                    legend="Staff behaviour"
                    value={staffBehaviour}
                    onChange={setStaffBehaviour}
                    allowSkip
                    size="sm"
                  />
                  <StarRatingInput
                    name="waitTime"
                    legend="Waiting time"
                    value={waitTime}
                    onChange={setWaitTime}
                    allowSkip
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <Textarea
                  id="feedback-comment"
                  label="Your comments"
                  value={comment}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setComment(event.target.value);
                    clearError('comment');
                  }}
                  maxLength={2000}
                  rows={5}
                  placeholder="What went well? What could we improve?"
                  hint="Maximum 2000 characters."
                  error={fieldErrors.comment}
                />
                <p className="mt-1 text-right text-xs text-gray-500" aria-hidden="true">
                  {comment.length} / 2000 characters
                </p>
                <p className="text-xs text-gray-500">
                  Please do not include medical details or other sensitive information.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Contact details</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Optional. Leave these blank to stay anonymous. We only use them to follow up on
                    your feedback.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="feedback-name"
                    label="Name"
                    value={name}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setName(event.target.value);
                      clearError('name');
                    }}
                    maxLength={120}
                    placeholder="Your name"
                    autoComplete="name"
                    error={fieldErrors.name}
                  />
                  <Input
                    id="feedback-phone"
                    label="Phone number"
                    type="tel"
                    value={phone}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setPhone(event.target.value);
                      clearError('phone');
                    }}
                    maxLength={20}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    hint="Include the country or STD code."
                    error={fieldErrors.phone}
                  />
                  <Input
                    id="feedback-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setEmail(event.target.value);
                      clearError('email');
                    }}
                    maxLength={254}
                    placeholder="your@email.com"
                    autoComplete="email"
                    error={fieldErrors.email}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              {/* Honeypot: off-screen, not focusable, ignored by assistive tech. */}
              <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="feedback-website">Website</label>
                <input
                  id="feedback-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setWebsite(event.target.value)
                  }
                />
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
                  <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  Your feedback helps us improve hospital services.
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

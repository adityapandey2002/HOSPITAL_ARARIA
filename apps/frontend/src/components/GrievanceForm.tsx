'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  AlertTriangle,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Mail,
  Phone,
  User,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import { toast } from 'sonner';
import { api, handleApiResponse } from '@/lib/api';

const grievanceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type GrievanceFormData = z.infer<typeof grievanceSchema>;

const categories = [
  { value: 'MEDICAL_NEGLIGENCE', label: 'Medical Negligence', icon: AlertTriangle },
  { value: 'STAFF_BEHAVIOR', label: 'Staff Behavior', icon: User },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure Issues', icon: Shield },
  { value: 'BILLING', label: 'Billing Disputes', icon: FileText },
  { value: 'APPOINTMENT', label: 'Appointment Issues', icon: Clock },
  { value: 'MEDICINE_AVAILABILITY', label: 'Medicine Availability', icon: AlertCircle },
  { value: 'CLEANLINESS', label: 'Cleanliness & Hygiene', icon: Shield },
  { value: 'OTHER', label: 'Other', icon: Info },
];

export function GrievanceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
  });

  const onSubmit = async (data: GrievanceFormData) => {
    setIsSubmitting(true);
    try {
      const response = await api.submitGrievance(data);
      const grievance = handleApiResponse(response);

      setComplaintId(grievance.id);
      setSubmitted(true);

      toast.success('Grievance submitted successfully!', {
        description: 'Your complaint is registered. Keep the reference number to track it.',
        duration: 10000,
      });
    } catch (error) {
      toast.error('Submission failed', {
        description:
          (error as { message?: string })?.message ||
          'Please try again or contact the hospital directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewComplaint = () => {
    setSubmitted(false);
    setComplaintId(null);
    reset();
  };

  if (submitted) {
    return (
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
              <CheckCircle className="h-10 w-10 text-success-600" />
            </div>

            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Grievance Submitted Successfully!
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Your complaint has been registered and forwarded to the concerned department.
            </p>

            <div className="mb-8 rounded-2xl border border-primary-200 bg-primary-50 p-6 text-left">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-primary-900">
                <Info className="h-5 w-5" />
                Your Complaint Reference Number
              </h3>
              <div className="text-center">
                <p className="break-all font-mono text-lg font-bold text-primary-600">
                  {complaintId}
                </p>
                <p className="mt-2 text-sm text-primary-700">Also sent to your email and SMS</p>
              </div>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <Shield className="mx-auto mb-2 h-6 w-6 text-primary-600" />
                <p className="text-sm text-gray-600">CPGRAMS Integrated</p>
                <p className="font-medium text-gray-900">Auto-forwarded to CPGRAMS</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <Clock className="mx-auto mb-2 h-6 w-6 text-primary-600" />
                <p className="text-sm text-gray-600">Resolution Timeline</p>
                <p className="font-medium text-gray-900">30 Days Maximum</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <Mail className="mx-auto mb-2 h-6 w-6 text-primary-600" />
                <p className="text-sm text-gray-600">Updates via</p>
                <p className="font-medium text-gray-900">Email & SMS</p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button onClick={handleNewComplaint} variant="outline">
                File Another Complaint
              </Button>
              <Button
                onClick={() => (window.location.href = '/complaints/track')}
                variant="primary"
              >
                Track Complaint Status
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Info Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <Shield className="mb-2 h-6 w-6 text-primary-600" />
              <h4 className="mb-1 font-semibold text-primary-900">CPGRAMS Integrated</h4>
              <p className="text-sm text-primary-700">Auto-forwarded to national portal</p>
            </div>
            <div className="border-warning-200 rounded-xl border bg-warning-50 p-4">
              <Clock className="mb-2 h-6 w-6 text-warning-600" />
              <h4 className="text-warning-900 mb-1 font-semibold">30-Day Resolution</h4>
              <p className="text-sm text-warning-700">Mandated by DARPG guidelines</p>
            </div>
            <div className="border-success-200 rounded-xl border bg-success-50 p-4">
              <CheckCircle className="mb-2 h-6 w-6 text-success-600" />
              <h4 className="text-success-900 mb-1 font-semibold">Track Status</h4>
              <p className="text-sm text-success-700">Real-time status updates</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-2xl bg-gray-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="h-5 w-5 text-primary-600" />
                Personal Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Full Name *"
                  placeholder="Enter your full name"
                  {...register('name')}
                  error={errors.name?.message}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
                <Input
                  label="Phone Number *"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-primary-600" />
                Complaint Details
              </h3>

              <Select
                label="Category *"
                {...register('category')}
                options={categories.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Select complaint category"
                error={errors.category?.message}
              />

              <Input
                label="Subject *"
                placeholder="Brief summary of your complaint"
                {...register('subject')}
                error={errors.subject?.message}
              />

              <Textarea
                label="Description *"
                placeholder="Describe your complaint in detail. Include dates, names, locations, and any relevant information..."
                {...register('description')}
                error={errors.description?.message}
                rows={6}
              />
            </div>

            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-primary-900">
                <Info className="h-5 w-5" />
                Important Information
              </h4>
              <ul className="space-y-2 text-sm text-primary-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Your complaint will be forwarded to CPGRAMS for centralized tracking
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  You will receive a unique complaint ID via email and SMS
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Resolution timeline: Maximum 30 days as per DARPG guidelines
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  You can track status online using the complaint ID
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  For urgent medical emergencies, please call 108 or visit Emergency Department
                </li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="w-full min-w-[200px] md:w-auto"
              >
                Submit Grievance
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Track Existing Complaint */}
          <div className="mt-12 rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              Already have a complaint ID?
            </h3>
            <p className="mb-4 text-gray-600">Track the status of your existing grievance</p>
            <Button variant="outline" onClick={() => (window.location.href = '/complaints/track')}>
              Track Complaint Status
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

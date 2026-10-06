'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, AlertTriangle, Shield, Clock, 
  ArrowRight, CheckCircle, AlertCircle, Info,
  Mail, Phone, User, MessageSquare
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import { toast } from 'sonner';

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const id = `GRS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setComplaintId(id);
      setSubmitted(true);
      
      toast.success('Grievance submitted successfully!', {
        description: `Your complaint ID is ${id}. You can track status using this ID.`,
        duration: 10000,
      });
    } catch (error) {
      toast.error('Submission failed', {
        description: 'Please try again or contact the hospital directly.',
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Grievance Submitted Successfully!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your complaint has been registered and forwarded to the concerned department.
            </p>
            
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Your Complaint Reference Number
              </h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600 font-mono tracking-wider">{complaintId}</p>
                <p className="text-sm text-primary-700 mt-2">Also sent to your email and SMS</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <Shield className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">CPGRAMS Integrated</p>
                <p className="font-medium text-gray-900">Auto-forwarded to CPGRAMS</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <Clock className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Resolution Timeline</p>
                <p className="font-medium text-gray-900">30 Days Maximum</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <Mail className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Updates via</p>
                <p className="font-medium text-gray-900">Email & SMS</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleNewComplaint} variant="outline">
                File Another Complaint
              </Button>
              <Button 
                onClick={() => window.location.href = '/grievances/track'}
                variant="primary"
              >
                Track Status
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <Shield className="w-6 h-6 text-primary-600 mb-2" />
              <h4 className="font-semibold text-primary-900 mb-1">CPGRAMS Integrated</h4>
              <p className="text-sm text-primary-700">Auto-forwarded to national portal</p>
            </div>
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl">
              <Clock className="w-6 h-6 text-warning-600 mb-2" />
              <h4 className="font-semibold text-warning-900 mb-1">30-Day Resolution</h4>
              <p className="text-sm text-warning-700">Mandated by DARPG guidelines</p>
            </div>
            <div className="p-4 bg-success-50 border border-success-200 rounded-xl">
              <CheckCircle className="w-6 h-6 text-success-600 mb-2" />
              <h4 className="font-semibold text-success-900 mb-1">Track Status</h4>
              <p className="text-sm text-success-700">Real-time status updates</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
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

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Complaint Details
              </h3>
              
              <Select
                label="Category *"
                {...register('category')}
                options={categories.map(c => ({ value: c.value, label: c.label }))}
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

            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6">
              <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Important Information
              </h4>
              <ul className="space-y-2 text-sm text-primary-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Your complaint will be forwarded to CPGRAMS for centralized tracking
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  You will receive a unique complaint ID via email and SMS
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Resolution timeline: Maximum 30 days as per DARPG guidelines
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  You can track status online using the complaint ID
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  For urgent medical emergencies, please call 108 or visit Emergency Department
                </li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="w-full md:w-auto min-w-[200px]"
              >
                Submit Grievance
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Track Existing Complaint */}
          <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              Already have a complaint ID?
            </h3>
            <p className="text-gray-600 mb-4">Track the status of your existing grievance</p>
            <Button variant="outline" onClick={() => window.location.href = '/grievances/track'}>
              Track Complaint Status
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
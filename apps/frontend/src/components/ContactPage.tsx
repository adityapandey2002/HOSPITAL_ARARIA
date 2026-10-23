'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Hospital,
  Ambulance,
  Droplet,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  Info,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input, Textarea, Select } from '@dh-araria/ui/components';
import { toast } from 'sonner';
import { api, handleApiResponse } from '@/lib/api';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const subjects = [
  { value: 'GENERAL', label: 'General Inquiry' },
  { value: 'APPOINTMENT', label: 'Appointment Related' },
  { value: 'BILLING', label: 'Billing & Insurance' },
  { value: 'MEDICAL_RECORDS', label: 'Medical Records' },
  { value: 'COMPLAINT', label: 'Complaint / Grievance' },
  { value: 'FEEDBACK', label: 'Feedback & Suggestions' },
  { value: 'OTHER', label: 'Other' },
];

const contactInfo = [
  {
    icon: Hospital,
    title: 'Hospital Address',
    details: [
      'District Hospital Araria',
      'Near District Collectorate',
      'Araria, Bihar - 854311',
      'India',
    ],
    color: 'primary',
  },
  {
    icon: Phone,
    title: 'Phone Numbers',
    details: [
      'Main: +91-6453-222123',
      'Admin: +91-6453-222124',
      'Emergency: 108 / 102',
      'Blood Bank: +91-6453-222102',
    ],
    color: 'secondary',
  },
  {
    icon: Mail,
    title: 'Email Addresses',
    details: [
      'General: dh.araria@bihar.gov.in',
      'Superintendent: superintendent.dhararia@bihar.gov.in',
      'Grievances: grievances.dhararia@bihar.gov.in',
    ],
    color: 'success',
  },
  {
    icon: Clock,
    title: 'Working Hours',
    details: [
      'OPD: Mon-Sat 9:00 AM - 4:00 PM',
      'Emergency: 24 Hours / 7 Days',
      'Pharmacy: Mon-Sat 8:00 AM - 8:00 PM',
      'Blood Bank: Mon-Sat 9:00 AM - 5:00 PM',
    ],
    color: 'warning',
  },
];

const emergencyContacts = [
  { label: 'National Emergency', number: '108', icon: AlertCircle, color: 'danger' },
  { label: 'Ambulance Service', number: '102', icon: Ambulance, color: 'primary' },
  { label: 'Hospital Emergency', number: '+91-6453-222100', icon: Hospital, color: 'secondary' },
  { label: 'Blood Bank', number: '+91-6453-222102', icon: Droplet, color: 'danger' },
  { label: 'Women Helpline', number: '181', icon: MessageSquare, color: 'secondary' },
  { label: 'Child Helpline', number: '1098', icon: MessageSquare, color: 'success' },
];

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await api.submitContactMessage(data);
      handleApiResponse(response);

      setSubmitted(true);
      toast.success('Message sent successfully!', {
        description: 'We will get back to you within 24-48 hours.',
      });
    } catch (error) {
      toast.error('Failed to send message', {
        description:
          (error as { message?: string })?.message || 'Please try again or contact us directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
              <CheckCircle className="h-10 w-10 text-success-600" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Message Sent Successfully!</h2>
            <p className="mb-8 text-lg text-gray-600">
              Thank you for contacting us. We have received your message and will respond within
              24-48 hours.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                reset();
              }}
              variant="outline"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="space-y-6 lg:col-span-1">
            {contactInfo.map((info, index) => (
              <div
                key={info.title}
                className="animate-slide-up rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={cn(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                    `bg-${info.color}-100 text-${info.color}-600`
                  )}
                >
                  <info.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-semibold text-gray-900">{info.title}</h3>
                <div className="space-y-2 text-gray-600">
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-sm">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Emergency Contacts */}
            <div
              className="animate-slide-up rounded-2xl border border-danger-100 bg-danger-50 p-6"
              style={{ animationDelay: '500ms' }}
            >
              <h3 className="text-danger-900 mb-4 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-5 w-5" />
                Emergency Contacts
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {emergencyContacts.map((contact) => (
                  <a
                    key={contact.label}
                    href={`tel:${contact.number}`}
                    className={cn(
                      'rounded-xl p-3 text-center transition-all',
                      `bg-${contact.color}-100 text-${contact.color}-700 hover:bg-${contact.color}-200`
                    )}
                  >
                    <contact.icon className="mx-auto mb-1 h-5 w-5" />
                    <p className="text-xs font-medium">{contact.label}</p>
                    <p className="text-sm font-bold">{contact.number}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form / Map */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              {/* Map Placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-primary-100 to-primary-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-8 text-center">
                    <MapPin className="mx-auto mb-4 h-16 w-16 text-primary-200" />
                    <h3 className="mb-2 text-xl font-semibold text-primary-700">Interactive Map</h3>
                    <p className="mb-4 text-primary-600">
                      Click for directions to District Hospital Araria
                    </p>
                    <a
                      href="https://maps.google.com/?q=District+Hospital+Araria,+Bihar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
                    >
                      <Navigation className="h-5 w-5" />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="p-6 md:p-8">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Send us a Message</h2>
                <p className="mb-6 text-gray-600">
                  Fill out the form below and we&rsquo;ll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Full Name *"
                      placeholder="Your full name"
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
                    <Select
                      label="Subject *"
                      {...register('subject')}
                      options={subjects.map((s) => ({ value: s.value, label: s.label }))}
                      placeholder="Select a subject"
                      error={errors.subject?.message}
                    />
                  </div>

                  <Textarea
                    label="Message *"
                    placeholder="Describe your inquiry in detail..."
                    {...register('message')}
                    error={errors.message?.message}
                    rows={5}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      loading={isSubmitting}
                      className="min-w-[200px]"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Link
            href="/appointments"
            className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform group-hover:scale-110">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Book Appointment</h3>
            <p className="mb-4 text-gray-600">
              Schedule your consultation online with our specialist doctors.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-all group-hover:gap-2">
              Book Now
              <Send className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href="/grievances"
            className="hover:border-warning-200 group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 text-warning-600 transition-transform group-hover:scale-110">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">File Grievance</h3>
            <p className="mb-4 text-gray-600">
              Submit a formal complaint through our CPGRAMS-integrated system.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-warning-600 transition-all group-hover:gap-2">
              File Complaint
              <Send className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href="/blood-bank"
            className="hover:border-danger-200 group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100 text-danger-600 transition-transform group-hover:scale-110">
              <Droplet className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Blood Bank</h3>
            <p className="mb-4 text-gray-600">
              Check real-time blood availability or request blood for patients.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-danger-600 transition-all group-hover:gap-2">
              Check Availability
              <Send className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

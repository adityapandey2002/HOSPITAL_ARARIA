'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MapPin, Phone, Mail, Clock, Hospital, 
  Ambulance, Droplet, MessageSquare, Send,
  AlertCircle, CheckCircle, Info, Navigation
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input, Textarea, Select } from '@dh-araria/ui/components';
import { toast } from 'sonner';

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
      'India'
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
      'Blood Bank: +91-6453-222102'
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
      'Blood Bank: Mon-Sat 9:00 AM - 5:00 PM'
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      toast.success('Message sent successfully!', {
        description: 'We will get back to you within 24-48 hours.',
      });
    } catch (error) {
      toast.error('Failed to send message', {
        description: 'Please try again or contact us directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for contacting us. We have received your message and will respond within 24-48 hours.
            </p>
            <Button onClick={() => { setSubmitted(false); reset(); }} variant="outline">
              Send Another Message
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((info, index) => (
              <div
                key={info.title}
                className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  `bg-${info.color}-100 text-${info.color}-600`
                )}>
                  <info.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">{info.title}</h3>
                <div className="space-y-2 text-gray-600">
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-sm">{detail}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Emergency Contacts */}
            <div className="p-6 bg-danger-50 border border-danger-100 rounded-2xl animate-slide-up" style={{ animationDelay: '500ms' }}>
              <h3 className="font-semibold text-danger-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Emergency Contacts
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {emergencyContacts.map((contact) => (
                  <a
                    key={contact.label}
                    href={`tel:${contact.number}`}
                    className={cn(
                      'p-3 rounded-xl text-center transition-all',
                      `bg-${contact.color}-100 text-${contact.color}-700 hover:bg-${contact.color}-200`
                    )}
                  >
                    <contact.icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">{contact.label}</p>
                    <p className="text-sm font-bold">{contact.number}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form / Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {/* Map Placeholder */}
              <div className="aspect-video relative bg-gradient-to-br from-primary-100 to-primary-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="w-16 h-16 text-primary-200 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary-700 mb-2">Interactive Map</h3>
                    <p className="text-primary-600 mb-4">Click for directions to District Hospital Araria</p>
                    <a
                      href="https://maps.google.com/?q=District+Hospital+Araria,+Bihar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <Navigation className="w-5 h-5" />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                <p className="text-gray-600 mb-6">Fill out the form below and we'll get back to you as soon as possible.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
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
                      options={subjects.map(s => ({ value: s.value, label: s.label }))}
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
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Link
            href="/appointments"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Appointment</h3>
            <p className="text-gray-600 mb-4">Schedule your consultation online with our specialist doctors.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
              Book Now
              <Send className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/grievances"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-warning-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-warning-100 text-warning-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">File Grievance</h3>
            <p className="text-gray-600 mb-4">Submit a formal complaint through our CPGRAMS-integrated system.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-warning-600 group-hover:gap-2 transition-all">
              File Complaint
              <Send className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/blood-bank"
            className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-danger-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 bg-danger-100 text-danger-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blood Bank</h3>
            <p className="text-gray-600 mb-4">Check real-time blood availability or request blood for patients.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-danger-600 group-hover:gap-2 transition-all">
              Check Availability
              <Send className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
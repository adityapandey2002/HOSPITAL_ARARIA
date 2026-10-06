'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar, Clock, User, Stethoscope, Hospital, 
  ArrowRight, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import { toast } from 'sonner';

const appointmentSchema = z.object({
  departmentId: z.string().min(1, 'Please select a department'),
  doctorId: z.string().min(1, 'Please select a doctor'),
  appointmentDate: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a time slot'),
  type: z.enum(['OPD', 'TELECONSULTATION', 'FOLLOW_UP']),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const departments = [
  { id: 'general-medicine', name: 'General Medicine' },
  { id: 'pediatrics', name: 'Pediatrics' },
  { id: 'obstetrics-gynecology', name: 'Obstetrics & Gynecology' },
  { id: 'orthopedics', name: 'Orthopedics' },
  { id: 'surgery', name: 'General Surgery' },
  { id: 'ophthalmology', name: 'Ophthalmology' },
  { id: 'ent', name: 'ENT' },
  { id: 'dermatology', name: 'Dermatology' },
  { id: 'psychiatry', name: 'Psychiatry' },
  { id: 'radiology', name: 'Radiology' },
  { id: 'dental', name: 'Dental Surgery' },
  { id: 'physiotherapy', name: 'Physiotherapy' },
];

const doctorsByDepartment: Record<string, { id: string; name: string; specialization: string; fee: number }[]> = {
  'general-medicine': [
    { id: '1', name: 'Dr. Rajesh Kumar', specialization: 'Cardiology', fee: 500 },
    { id: '7', name: 'Dr. Manoj Kumar', specialization: 'Neurology', fee: 500 },
  ],
  'pediatrics': [
    { id: '4', name: 'Dr. Sunita Devi', specialization: 'Pediatrics', fee: 350 },
  ],
  'obstetrics-gynecology': [
    { id: '2', name: 'Dr. Priya Sharma', specialization: 'Gynecology & Obstetrics', fee: 400 },
  ],
  'orthopedics': [
    { id: '3', name: 'Dr. Amit Singh', specialization: 'Orthopedics', fee: 600 },
  ],
  'surgery': [
    { id: '5', name: 'Dr. Vikash Patel', specialization: 'General Surgery', fee: 450 },
  ],
  'dermatology': [
    { id: '6', name: 'Dr. Anjali Verma', specialization: 'Dermatology', fee: 400 },
  ],
  'ophthalmology': [
    { id: '8', name: 'Dr. Rekha Sinha', specialization: 'Ophthalmology', fee: 400 },
  ],
};

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
];

const appointmentTypes = [
  { value: 'OPD', label: 'OPD Consultation', description: 'In-person consultation at hospital' },
  { value: 'TELECONSULTATION', label: 'Teleconsultation', description: 'Video/phone consultation from home' },
  { value: 'FOLLOW_UP', label: 'Follow-up Visit', description: 'Follow-up for existing treatment' },
];

export function AppointmentBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'OPD',
    },
  });

  const selectedDepartment = watch('departmentId');
  const availableDoctors = doctorsByDepartment[selectedDepartment] || [];
  const selectedDoctor = availableDoctors.find(d => d.id === watch('doctorId'));

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Appointment booked successfully!', {
        description: `Your appointment has been confirmed. Token number will be sent via SMS.`,
      });
      
      // Reset form
      setCurrentStep(1);
    } catch (error) {
      toast.error('Booking failed', {
        description: 'Please try again or contact the hospital directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Department', icon: Hospital },
    { number: 2, title: 'Doctor', icon: Stethoscope },
    { number: 3, title: 'Date & Time', icon: Calendar },
    { number: 4, title: 'Details', icon: User },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                  currentStep >= step.number
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}>
                  {currentStep >= step.number && step.number < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'hidden md:block w-20 h-1 mx-2',
                    currentStep > step.number + 1 ? 'bg-primary-600' : 'bg-gray-200'
                  )} />
                )}
                <span className={cn(
                  'hidden md:block text-center w-24 text-sm font-medium',
                  currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Department */}
            {currentStep === 1 && (
              <div className="animate-fade-in" role="step" aria-label="Step 1: Select Department">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Department</h2>
                <p className="text-gray-600 mb-6">Choose the medical department for your consultation</p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setValue('departmentId', dept.id);
                        setValue('doctorId', '');
                        nextStep();
                      }}
                      className={cn(
                        'p-6 rounded-2xl border-2 transition-all text-left hover:shadow-lg',
                        selectedDepartment === dept.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      )}
                    >
                      <Hospital className={cn(
                        'w-8 h-8 mb-3',
                        selectedDepartment === dept.id ? 'text-primary-600' : 'text-gray-400'
                      )} />
                      <h3 className={cn(
                        'font-semibold',
                        selectedDepartment === dept.id ? 'text-primary-600' : 'text-gray-900'
                      )}>
                        {dept.name}
                      </h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Doctor */}
            {currentStep === 2 && (
              <div className="animate-fade-in" role="step" aria-label="Step 2: Select Doctor">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Doctor</h2>
                <p className="text-gray-600 mb-6">Choose your preferred specialist</p>
                
                {availableDoctors.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors available</h3>
                    <p className="text-gray-500 mb-4">Please select a department first</p>
                    <Button variant="outline" onClick={prevStep}>Back to Departments</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableDoctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setValue('doctorId', doctor.id);
                          nextStep();
                        }}
                        className={cn(
                          'w-full p-5 rounded-2xl border-2 transition-all text-left hover:shadow-lg',
                          watch('doctorId') === doctor.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                            <p className="text-sm text-primary-600">{doctor.specialization}</p>
                            <p className="text-xs text-gray-500 mt-1">₹{doctor.fee} • Consultation fee</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Date & Time */}
            {currentStep === 3 && (
              <div className="animate-fade-in" role="step" aria-label="Step 3: Select Date and Time">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
                <p className="text-gray-600 mb-6">Choose a convenient appointment slot</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Appointment Date</label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      {...register('appointmentDate')}
                      error={errors.appointmentDate?.message}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Appointment Type</label>
                    <Select
                      {...register('type')}
                      options={appointmentTypes.map(t => ({ value: t.value, label: t.label }))}
                      placeholder="Select appointment type"
                      error={errors.type?.message}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="form-label">Available Time Slots</label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setValue('startTime', slot)}
                        className={cn(
                          'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                          watch('startTime') === slot
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                        )}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                  {errors.startTime && (
                    <p className="form-error">{errors.startTime.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {currentStep === 4 && (
              <div className="animate-fade-in" role="step" aria-label="Step 4: Enter Details">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Details</h2>
                <p className="text-gray-600 mb-6">Please provide the reason for your visit</p>
                
                <div className="space-y-4">
                  <Textarea
                    label="Reason for Visit *"
                    placeholder="Describe your symptoms or reason for consultation..."
                    {...register('reason')}
                    error={errors.reason?.message}
                    rows={4}
                  />
                  
                  <Textarea
                    label="Additional Notes (Optional)"
                    placeholder="Any previous reports, medications, allergies, or specific concerns..."
                    {...register('notes')}
                    rows={3}
                  />
                  
                  {/* Selected Doctor Summary */}
                  {selectedDoctor && (
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                      <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Appointment Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-primary-700">Doctor:</span>
                          <p className="font-medium text-primary-900">{selectedDoctor.name}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Specialization:</span>
                          <p className="font-medium text-primary-900">{selectedDoctor.specialization}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Date:</span>
                          <p className="font-medium text-primary-900">{watch('appointmentDate') ? formatDate(watch('appointmentDate')) : 'Not selected'}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Time:</span>
                          <p className="font-medium text-primary-900">{watch('startTime') ? formatTime(watch('startTime')) : 'Not selected'}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Type:</span>
                          <p className="font-medium text-primary-900">{watch('type')}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Fee:</span>
                          <p className="font-medium text-primary-900">₹{selectedDoctor.fee}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isStepInvalid()}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full md:w-auto"
                >
                  Confirm Appointment
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function isStepInvalid() {
  // This would need access to form state - simplified for now
  return false;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Hospital,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { Button, Input, Select, Textarea } from '@dh-araria/ui/components';
import { toast } from 'sonner';
import { api, handleApiResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

const appointmentTypes = [
  { value: 'OPD', label: 'OPD Consultation', description: 'In-person consultation at hospital' },
  {
    value: 'TELECONSULTATION',
    label: 'Teleconsultation',
    description: 'Video/phone consultation from home',
  },
  { value: 'FOLLOW_UP', label: 'Follow-up Visit', description: 'Follow-up for existing treatment' },
];

interface DepartmentOption {
  id: string;
  name: string;
}

interface DoctorOption {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
  departmentId: string;
}

interface SlotOption {
  startTime: string;
  endTime: string;
}

export function AppointmentBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const { isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'OPD',
    },
  });

  const selectedDepartment = watch('departmentId');
  const selectedDoctorId = watch('doctorId');
  const appointmentDate = watch('appointmentDate');

  const availableDoctors = doctors.filter((doctor) => doctor.departmentId === selectedDepartment);
  const selectedDoctor = availableDoctors.find((d) => d.id === selectedDoctorId);

  // Directory data comes from the API; the old hard-coded ids ("1",
  // "general-medicine") never matched the UUIDs stored in PostgreSQL.
  useEffect(() => {
    let cancelled = false;
    api
      .get<DepartmentOption[]>('/departments')
      .then((response) => {
        if (!cancelled && response.success) setDepartments(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors([]);
      return;
    }

    let cancelled = false;
    api
      .get<DoctorOption[]>('/doctors', {
        departmentId: selectedDepartment,
        isActive: true,
        limit: 100,
      })
      .then((response) => {
        if (!cancelled && response.success) setDoctors(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setDoctors([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDepartment]);

  // Slots depend on both the doctor and the weekday, so they are fetched after
  // a date is chosen rather than rendered from a static list.
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    api
      .get<SlotOption[]>(`/doctors/${selectedDoctorId}/slots`, { date: appointmentDate })
      .then((response) => {
        if (!cancelled && response.success) {
          setSlots(response.data ?? []);
          setValue('startTime', '');
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDoctorId, appointmentDate, setValue]);

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book', {
        description: 'Appointments are linked to your patient account. Sign in and try again.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.bookAppointment({
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        type: data.type,
        reason: data.reason,
        notes: data.notes,
      });
      const appointment = handleApiResponse(response);

      toast.success('Appointment booked successfully!', {
        description: `Token number ${appointment.tokenNumber}. Please arrive 15 minutes early.`,
      });

      reset({ type: 'OPD' });
      setSlots([]);
      setCurrentStep(1);
    } catch (error) {
      toast.error('Booking failed', {
        description:
          (error as { message?: string })?.message ||
          'Please try again or contact the hospital directly.',
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
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="mx-auto mb-10 max-w-3xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    currentStep >= step.number
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {currentStep >= step.number && step.number < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 hidden h-1 w-20 md:block',
                      currentStep > step.number + 1 ? 'bg-primary-600' : 'bg-gray-200'
                    )}
                  />
                )}
                <span
                  className={cn(
                    'hidden w-24 text-center text-sm font-medium md:block',
                    currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
                  )}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Department */}
            {currentStep === 1 && (
              <div className="animate-fade-in" role="group" aria-label="Step 1: Select Department">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Select Department</h2>
                <p className="mb-6 text-gray-600">
                  Choose the medical department for your consultation
                </p>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        'rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg',
                        selectedDepartment === dept.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      )}
                    >
                      <Hospital
                        className={cn(
                          'mb-3 h-8 w-8',
                          selectedDepartment === dept.id ? 'text-primary-600' : 'text-gray-400'
                        )}
                      />
                      <h3
                        className={cn(
                          'font-semibold',
                          selectedDepartment === dept.id ? 'text-primary-600' : 'text-gray-900'
                        )}
                      >
                        {dept.name}
                      </h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Doctor */}
            {currentStep === 2 && (
              <div className="animate-fade-in" role="group" aria-label="Step 2: Select Doctor">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Select Doctor</h2>
                <p className="mb-6 text-gray-600">Choose your preferred specialist</p>

                {availableDoctors.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No doctors available</h3>
                    <p className="mb-4 text-gray-500">Please select a department first</p>
                    <Button variant="outline" onClick={prevStep}>
                      Back to Departments
                    </Button>
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
                          'w-full rounded-2xl border-2 p-5 text-left transition-all hover:shadow-lg',
                          watch('doctorId') === doctor.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            <Stethoscope className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                            <p className="text-sm text-primary-600">{doctor.specialization}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              ₹{doctor.consultationFee} • Consultation fee
                            </p>
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
              <div
                className="animate-fade-in"
                role="group"
                aria-label="Step 3: Select Date and Time"
              >
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Select Date & Time</h2>
                <p className="mb-6 text-gray-600">Choose a convenient appointment slot</p>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="appointment-date">
                      Appointment Date
                    </label>
                    <Input
                      id="appointment-date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      max={
                        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      }
                      {...register('appointmentDate')}
                      error={errors.appointmentDate?.message}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="appointment-type">
                      Appointment Type
                    </label>
                    <Select
                      id="appointment-type"
                      {...register('type')}
                      options={appointmentTypes.map((t) => ({ value: t.value, label: t.label }))}
                      placeholder="Select appointment type"
                      error={errors.type?.message}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <fieldset>
                    <legend className="form-label">Available Time Slots</legend>
                    <div className="flex flex-wrap gap-2">
                      {slots.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          {selectedDoctorId && appointmentDate
                            ? 'No slots are available for this doctor on the selected date.'
                            : 'Choose a date to see available slots.'}
                        </p>
                      ) : (
                        slots.map((slot) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setValue('startTime', slot.startTime)}
                            className={cn(
                              'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                              watch('startTime') === slot.startTime
                                ? 'border-primary-600 bg-primary-600 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                            )}
                          >
                            {formatTime(slot.startTime)}
                          </button>
                        ))
                      )}
                    </div>
                    {errors.startTime && <p className="form-error">{errors.startTime.message}</p>}
                  </fieldset>
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {currentStep === 4 && (
              <div className="animate-fade-in" role="group" aria-label="Step 4: Enter Details">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Appointment Details</h2>
                <p className="mb-6 text-gray-600">Please provide the reason for your visit</p>

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
                    <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
                      <h4 className="mb-3 flex items-center gap-2 font-semibold text-primary-900">
                        <Info className="h-4 w-4" />
                        Appointment Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-primary-700">Doctor:</span>
                          <p className="font-medium text-primary-900">{selectedDoctor.name}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Specialization:</span>
                          <p className="font-medium text-primary-900">
                            {selectedDoctor.specialization}
                          </p>
                        </div>
                        <div>
                          <span className="text-primary-700">Date:</span>
                          <p className="font-medium text-primary-900">
                            {watch('appointmentDate')
                              ? formatDate(watch('appointmentDate'))
                              : 'Not selected'}
                          </p>
                        </div>
                        <div>
                          <span className="text-primary-700">Time:</span>
                          <p className="font-medium text-primary-900">
                            {watch('startTime') ? formatTime(watch('startTime')) : 'Not selected'}
                          </p>
                        </div>
                        <div>
                          <span className="text-primary-700">Type:</span>
                          <p className="font-medium text-primary-900">{watch('type')}</p>
                        </div>
                        <div>
                          <span className="text-primary-700">Fee:</span>
                          <p className="font-medium text-primary-900">
                            ₹{selectedDoctor.consultationFee}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between border-t border-gray-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} disabled={isStepInvalid()}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="lg" loading={isSubmitting} className="w-full md:w-auto">
                  Confirm Appointment
                  <ArrowRight className="h-4 w-4" />
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

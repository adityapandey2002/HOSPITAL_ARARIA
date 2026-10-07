'use client';

import Link from 'next/link';
import { ArrowRight, Hospital, Shield, Clock, Users, Stethoscope } from 'lucide-react';

const stats = [
  { value: '300+', label: 'Bed Capacity', icon: Hospital },
  { value: '24/7', label: 'Emergency Services', icon: Clock },
  { value: '50+', label: 'Specialist Doctors', icon: Users },
  { value: '15+', label: 'Departments', icon: Stethoscope },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white pt-32">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary-100 opacity-50 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="animate-fade-in text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
              <Shield className="h-4 w-4" />
              <span>Government of Bihar | Ayushman Bharat Empanelled</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Your Trusted Healthcare Partner in{' '}
              <span className="text-primary-600">Araria, Bihar</span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600 sm:text-xl lg:mx-0">
              District Hospital Araria provides comprehensive, affordable, and quality healthcare
              services to the community. Book appointments online, consult specialists, and access
              24/7 emergency care.
            </p>

            <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/appointments"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all duration-200 hover:bg-primary-700 hover:shadow-xl"
              >
                Book Appointment
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-600 px-8 py-4 text-lg font-medium text-primary-600 transition-all duration-200 hover:bg-primary-50"
              >
                Find a Doctor
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-600" />
                <span>NABH Accredited</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-600" />
                <span>GIGW 3.0 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-600" />
                <span>ABDM Integrated</span>
              </div>
            </div>
          </div>

          {/* Right Content - Image/Illustration */}
          <div className="relative animate-slide-up">
            <div className="relative mx-auto aspect-square max-w-md">
              {/* Main hospital image placeholder */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-100 via-white to-secondary-100 shadow-2xl" />
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary-100 to-primary-50 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hospital className="h-32 w-32 text-primary-200" />
                </div>
                {/* Decorative elements */}
                <div className="absolute left-4 top-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/50">
                  <Stethoscope className="h-8 w-8 text-primary-500" />
                </div>
                <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/50">
                  <Users className="h-8 w-8 text-primary-500" />
                </div>
                <div className="absolute bottom-4 left-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/50">
                  <Clock className="h-8 w-8 text-primary-500" />
                </div>
                <div className="absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/50">
                  <Shield className="h-8 w-8 text-primary-500" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <stat.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-center text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-gray-300 pt-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        </div>
      </div>
    </section>
  );
}

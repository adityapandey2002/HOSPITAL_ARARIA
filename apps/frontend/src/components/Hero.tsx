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
    <section className="relative min-h-screen flex items-center justify-center pt-32 overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>Government of Bihar | Ayushman Bharat Empanelled</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Your Trusted Healthcare Partner in{' '}
              <span className="text-primary-600">Araria, Bihar</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              District Hospital Araria provides comprehensive, affordable, and quality healthcare services 
              to the community. Book appointments online, consult specialists, and access 24/7 emergency care.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                href="/appointments"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white text-lg font-medium rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Book Appointment
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary-600 text-primary-600 text-lg font-medium rounded-xl hover:bg-primary-50 transition-all duration-200"
              >
                Find a Doctor
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-600" />
                <span>NABH Accredited</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-600" />
                <span>GIGW 3.0 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-600" />
                <span>ABDM Integrated</span>
              </div>
            </div>
          </div>

          {/* Right Content - Image/Illustration */}
          <div className="relative animate-slide-up">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Main hospital image placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-100 rounded-3xl shadow-2xl" />
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-100 to-primary-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hospital className="w-32 h-32 text-primary-200" />
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 w-16 h-16 bg-white/50 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-primary-500" />
                </div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/50 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/50 rounded-xl flex items-center justify-center">
                  <Clock className="w-8 h-8 text-primary-500" />
                </div>
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/50 rounded-xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary-500" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 text-center">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
        </div>
      </div>
    </section>
  );
}
'use client';

import { 
  Ambulance, Phone, MapPin, Clock, Heart, 
  Shield, Truck, UserCheck, AlertTriangle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@dh-araria/shared/utils';

const emergencyServices = [
  {
    icon: Ambulance,
    title: '24/7 Ambulance Service',
    description: 'Free ambulance service with GPS tracking and trained paramedics. Dial 102 for immediate dispatch.',
    features: ['GPS-enabled ambulances', 'Trained paramedics', 'Basic life support', 'Free for BPL patients'],
    cta: 'Call 102',
    href: 'tel:102',
    color: 'primary',
  },
  {
    icon: Heart,
    title: 'Emergency Department',
    description: 'Fully equipped 20-bed emergency department with resuscitation bay, triage, and observation units.',
    features: ['24/7 specialist on-call', 'Trauma resuscitation', 'Poisoning management', 'Cardiac emergency care'],
    cta: 'Visit Emergency',
    href: '/services/emergency',
    color: 'danger',
  },
  {
    icon: Shield,
    title: 'Trauma Care',
    description: 'Designated trauma center with orthopedic, neurosurgical, and general surgical backup round the clock.',
    features: ['Trauma team activation', 'CT scan on-site', 'Blood bank access', 'ICU backup'],
    cta: 'Learn More',
    href: '/services/emergency/trauma',
    color: 'warning',
  },
  {
    icon: AlertTriangle,
    title: 'Disaster Management',
    description: 'Hospital disaster management plan with mass casualty protocols and coordination with district administration.',
    features: ['Mass casualty plan', 'Decontamination unit', 'Triage protocols', 'District coordination'],
    cta: 'View Plan',
    href: '/services/emergency/disaster',
    color: 'secondary',
  },
];

const colorStyles = {
  primary: 'bg-primary-100 text-primary-600 border-primary-200',
  danger: 'bg-danger-100 text-danger-600 border-danger-200',
  warning: 'bg-warning-100 text-warning-600 border-warning-200',
  secondary: 'bg-secondary-100 text-secondary-600 border-secondary-200',
};

export function EmergencyServices() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-danger-100 text-danger-700 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Services Available 24/7</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Emergency & Critical Care
          </h2>
          <p className="text-lg text-gray-600">
            Immediate medical attention when every second counts. Our emergency department is staffed 
            round the clock with specialists on call.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {emergencyServices.map((service, index) => (
            <article
              key={service.title}
              className={cn(
                'p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl animate-slide-up',
                colorStyles[service.color as keyof typeof colorStyles]
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                colorStyles[service.color as keyof typeof colorStyles].replace('border-', 'bg-')
              )}>
                <service.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              
              <ul className="space-y-2 mb-4">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <a
                href={service.href}
                className={cn(
                  'inline-flex items-center gap-1 font-medium transition-colors',
                  colorStyles[service.color as keyof typeof colorStyles].replace('border-', 'text-').replace('bg-', 'hover:bg-').replace('text-', 'hover:text-')
                )}
              >
                {service.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </article>
          ))}
        </div>

        {/* Emergency Contact Bar */}
        <div className="bg-gradient-to-r from-danger-600 to-danger-700 rounded-2xl p-6 md:p-8 text-white">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <Phone className="w-10 h-10 mx-auto mb-3 text-white/80" />
              <p className="text-sm text-white/70 mb-1">Ambulance</p>
              <a href="tel:102" className="text-2xl font-bold hover:text-yellow-200 transition-colors">102</a>
            </div>
            <div>
              <Phone className="w-10 h-10 mx-auto mb-3 text-white/80" />
              <p className="text-sm text-white/70 mb-1">National Emergency</p>
              <a href="tel:108" className="text-2xl font-bold hover:text-yellow-200 transition-colors">108</a>
            </div>
            <div>
              <Phone className="w-10 h-10 mx-auto mb-3 text-white/80" />
              <p className="text-sm text-white/70 mb-1">Hospital Emergency</p>
              <a href="tel:+91-6453-222100" className="text-lg font-bold hover:text-yellow-200 transition-colors">+91-6453-222100</a>
            </div>
            <div>
              <MapPin className="w-10 h-10 mx-auto mb-3 text-white/80" />
              <p className="text-sm text-white/70 mb-1">Location</p>
              <p className="font-medium">District Hospital Araria<br />Near Collectorate, Araria</p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-danger-600 font-semibold rounded-xl hover:bg-white/90 transition-colors"
            >
              Get Directions
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
import Link from 'next/link';
import {
  Bell,
  CalendarCheck,
  Droplet,
  HeartHandshake,
  MessagesSquare,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { Section } from '@dh-araria/ui/components';

interface QuickService {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const QUICK_SERVICES: QuickService[] = [
  {
    href: '/appointments',
    label: 'Appointments',
    description: 'Book an OPD slot',
    icon: CalendarCheck,
  },
  {
    href: '/doctors',
    label: 'Find a doctor',
    description: 'Specialists and OPD days',
    icon: Stethoscope,
  },
  {
    href: '/blood-bank',
    label: 'Blood bank',
    description: 'Group-wise availability',
    icon: Droplet,
  },
  {
    href: '/grievances',
    label: 'Grievances',
    description: 'Escalate an unresolved issue',
    icon: MessagesSquare,
  },
  {
    href: '/notices',
    label: 'Notices',
    description: 'Orders and public notices',
    icon: Bell,
  },
  {
    href: '/feedback',
    label: 'Feedback',
    description: 'Rate your visit',
    icon: HeartHandshake,
  },
];

export function QuickServices() {
  return (
    <Section
      tone="surface"
      spacing="md"
      eyebrow="Citizen services"
      title="What do you need today?"
      description="The six tasks citizens use most, without queueing at a counter."
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <li key={service.href}>
              <Link
                href={service.href}
                className="group flex h-full flex-col gap-3 rounded-xl border border-outline-variant bg-card p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-label text-on-surface">{service.label}</span>
                  <span className="mt-0.5 block text-label-sm font-normal text-on-surface-variant">
                    {service.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

import Link from 'next/link';
import {
  Bell,
  CalendarCheck,
  Droplet,
  HeartHandshake,
  MessageSquare,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { Section } from '@dh-araria/ui/components';
import { cn } from '@dh-araria/shared/utils';

interface QuickService {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: 'primary' | 'danger' | 'warning';
}

const QUICK_SERVICES: QuickService[] = [
  {
    href: '/appointments',
    label: 'Appointments',
    description: 'Book an OPD slot',
    icon: CalendarCheck,
    accent: 'primary',
  },
  {
    href: '/doctors',
    label: 'Find a doctor',
    description: 'Specialists & OPD days',
    icon: Stethoscope,
    accent: 'primary',
  },
  {
    href: '/blood-bank',
    label: 'Blood bank',
    description: 'Live district stock',
    icon: Droplet,
    accent: 'danger',
  },
  {
    href: '/complaint',
    label: 'File a complaint',
    description: 'No login needed',
    icon: MessageSquare,
    accent: 'warning',
  },
  {
    href: '/notices',
    label: 'Notices',
    description: 'Orders & circulars',
    icon: Bell,
    accent: 'primary',
  },
  {
    href: '/feedback',
    label: 'Feedback',
    description: 'Rate your visit',
    icon: HeartHandshake,
    accent: 'primary',
  },
];

const ICON_TONE: Record<QuickService['accent'], string> = {
  primary: 'bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-white',
  danger: 'bg-danger-50 text-danger-600 group-hover:bg-danger-600 group-hover:text-white',
  warning: 'bg-warning-50 text-warning-700 group-hover:bg-warning-600 group-hover:text-white',
};

const BORDER_HOVER: Record<QuickService['accent'], string> = {
  primary: 'hover:border-primary-300',
  danger: 'hover:border-danger-300',
  warning: 'hover:border-warning-300',
};

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
                className={cn(
                  'group flex h-full flex-col gap-3 rounded-xl border border-outline-variant bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
                  BORDER_HOVER[service.accent]
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    ICON_TONE[service.accent]
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{service.label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
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

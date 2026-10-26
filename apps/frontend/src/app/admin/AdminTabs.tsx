'use client';

import Link from 'next/link';
import {
  ChevronRight,
  ClipboardList,
  Mail,
  Stethoscope,
  Users,
} from 'lucide-react';
import { cn } from '@dh-araria/shared/utils';
import { useAuth } from '@/context/AuthContext';

export interface AdminTab {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

export function AdminTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = isAdmin || user?.role === 'STAFF';
  // The shared tabs are also shown during the initial auth read and to
  // unauthenticated visitors, whose click lands on the sign-in gate.
  const canSeeShared = isStaff || !user;

  const tabs: (AdminTab & { visible: boolean })[] = [
    {
      key: 'complaints',
      label: 'Complaints',
      icon: ClipboardList,
      href: '/admin/complaints',
      visible: canSeeShared,
    },
    {
      key: 'feedback',
      label: 'Feedback',
      icon: Mail,
      href: '/feedback/inbox',
      visible: canSeeShared,
    },
    {
      key: 'staff',
      label: 'Staff & Access',
      icon: Users,
      href: '/admin/staff',
      visible: isAdmin,
    },
    {
      key: 'doctors',
      label: 'Doctors',
      icon: Stethoscope,
      href: '/admin/doctors',
      visible: isAdmin,
    },
  ];

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
      {tabs
        .filter((tab) => tab.visible)
        .map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'border border-transparent hover:bg-gray-100 hover:text-gray-900',
              isAdmin ? 'text-primary-600 bg-primary-50 border-primary-200' : 'text-gray-500'
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        ))}
    </div>
  );
}

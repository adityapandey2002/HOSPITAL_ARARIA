'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ClipboardList,
  Mail,
  Stethoscope,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@dh-araria/ui/components';
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

  const tabs: AdminTab[] = [
    {
      key: 'complaints',
      label: 'Complaints',
      icon: ClipboardList,
      href: '/admin/complaints',
    },
    {
      key: 'feedback',
      label: 'Feedback',
      icon: Mail,
      href: '/feedback/inbox',
    },
    {
      key: 'doctors',
      label: 'Doctors',
      icon: Stethoscope,
      href: '/admin/doctors',
    },
    {
      key: 'nodal-officers',
      label: 'Nodal Officers',
      icon: ShieldAlert,
      href: '/admin/nodal-officers',
    },
  ];

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
      {tabs.map((tab) => (
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

'use client';

import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Megaphone,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Bell,
  Shield,
  Heart,
} from 'lucide-react';

const notices = [
  {
    id: '1',
    title: 'Free Health Check-up Camp - World Health Day',
    content:
      'District Hospital Araria is organizing a free comprehensive health check-up camp on World Health Day (April 7th). Services include general consultation, blood sugar testing, blood pressure monitoring, and specialist referrals.',
    category: 'PUBLIC_HEALTH',
    priority: 'HIGH',
    publishedAt: '2024-03-25',
    expiresAt: '2024-04-07',
    isPublished: true,
  },
  {
    id: '2',
    title: 'Recruitment: Staff Nurses & Pharmacists',
    content:
      'Applications are invited for the post of Staff Nurses (15 posts) and Pharmacists (5 posts) on contractual basis. Last date to apply: April 15, 2024. Download application form from the recruitment section.',
    category: 'RECRUITMENT',
    priority: 'HIGH',
    publishedAt: '2024-03-20',
    expiresAt: '2024-04-15',
    isPublished: true,
  },
  {
    id: '3',
    title: 'OPD Schedule Change - Effective April 1st',
    content:
      'Please note that OPD timings for General Medicine and Pediatrics departments have been revised. New timings: Morning 9:00 AM - 1:00 PM, Evening 4:00 PM - 6:00 PM. Emergency services remain 24/7.',
    category: 'SCHEDULE_CHANGE',
    priority: 'MEDIUM',
    publishedAt: '2024-03-28',
    expiresAt: null,
    isPublished: true,
  },
  {
    id: '4',
    title: 'Dengue Prevention Awareness Drive',
    content:
      'With the onset of monsoon, the hospital is conducting dengue prevention awareness sessions every Saturday at 10 AM in the OPD waiting area. Free dengue testing available for symptomatic patients.',
    category: 'PUBLIC_HEALTH',
    priority: 'MEDIUM',
    publishedAt: '2024-03-15',
    expiresAt: '2024-06-30',
    isPublished: true,
  },
  {
    id: '5',
    title: 'Tender Notice: Medical Equipment Procurement',
    content:
      'Sealed tenders are invited for supply and installation of MRI Machine (1.5T), Digital X-Ray, and Ultrasound Machine. Tender documents available at hospital procurement office.',
    category: 'TENDER',
    priority: 'LOW',
    publishedAt: '2024-03-10',
    expiresAt: '2024-04-30',
    isPublished: true,
  },
];

const categoryStyles = {
  GENERAL: 'bg-gray-100 text-gray-700',
  RECRUITMENT: 'bg-blue-100 text-blue-700',
  TENDER: 'bg-purple-100 text-purple-700',
  PUBLIC_HEALTH: 'bg-red-100 text-red-700',
  SCHEDULE_CHANGE: 'bg-yellow-100 text-yellow-700',
  EMERGENCY: 'bg-red-100 text-red-700',
};

const categoryIcons = {
  GENERAL: FileText,
  RECRUITMENT: Shield,
  TENDER: FileText,
  PUBLIC_HEALTH: Heart,
  SCHEDULE_CHANGE: Calendar,
  EMERGENCY: AlertTriangle,
};

const priorityStyles = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function Notices() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              <Bell className="h-8 w-8 text-blue-600" />
              Latest Notices & Announcements
            </h2>
            <p className="text-lg text-gray-600">
              Stay updated with hospital news, schedules, and public health advisories
            </p>
          </div>
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            View All Notices
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notices.slice(0, 6).map((notice, index) => {
            const CategoryIcon = categoryIcons[notice.category as keyof typeof categoryIcons];

            return (
              <article
                key={notice.id}
                className="group animate-slide-up rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      className={`h-5 w-5 ${categoryStyles[notice.category as keyof typeof categoryStyles]}`}
                    />
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${categoryStyles[notice.category as keyof typeof categoryStyles]}`}
                    >
                      {notice.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${priorityStyles[notice.priority as keyof typeof priorityStyles]}`}
                  >
                    {notice.priority}
                  </span>
                </div>

                <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  {notice.title}
                </h3>

                <p className="mb-4 line-clamp-3 text-sm text-gray-600">{notice.content}</p>

                <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Published: {formatDate(notice.publishedAt)}
                  </span>
                  {notice.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {formatDate(notice.expiresAt)}
                    </span>
                  )}
                </div>

                <Link
                  href={`/notices/${notice.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Read More
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 px-8 py-3 text-lg font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50"
          >
            View All Notices
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-16 grid gap-4 md:grid-cols-4">
          {[
            {
              icon: FileText,
              title: 'Circulars',
              desc: 'Official circulars & orders',
              href: '/notices?category=GENERAL',
            },
            {
              icon: Shield,
              title: 'Recruitment',
              desc: 'Job openings & applications',
              href: '/notices?category=RECRUITMENT',
            },
            {
              icon: Megaphone,
              title: 'Tenders',
              desc: 'Procurement & tenders',
              href: '/notices?category=TENDER',
            },
            {
              icon: Heart,
              title: 'Health Advisories',
              desc: 'Public health notices',
              href: '/notices?category=PUBLIC_HEALTH',
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

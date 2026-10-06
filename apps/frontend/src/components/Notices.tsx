'use client';

import Link from 'next/link';
import { 
  FileText, AlertTriangle, Megaphone, Calendar, 
  Clock, ExternalLink, ChevronRight, Bell, Shield
} from 'lucide-react';
import { formatDate } from '@dh-araria/shared/utils';
import { cn } from '@dh-araria/shared/utils';
import { Badge } from '@dh-araria/ui/components';

const notices = [
  {
    id: '1',
    title: 'Free Health Check-up Camp - World Health Day',
    content: 'District Hospital Araria is organizing a free comprehensive health check-up camp on World Health Day (April 7th). Services include general consultation, blood sugar testing, blood pressure monitoring, and specialist referrals.',
    category: 'PUBLIC_HEALTH',
    priority: 'HIGH',
    publishedAt: '2024-03-25',
    expiresAt: '2024-04-07',
    isPublished: true,
  },
  {
    id: '2',
    title: 'Recruitment: Staff Nurses & Pharmacists',
    content: 'Applications are invited for the post of Staff Nurses (15 posts) and Pharmacists (5 posts) on contractual basis. Last date to apply: April 15, 2024. Download application form from the recruitment section.',
    category: 'RECRUITMENT',
    priority: 'HIGH',
    publishedAt: '2024-03-20',
    expiresAt: '2024-04-15',
    isPublished: true,
  },
  {
    id: '3',
    title: 'OPD Schedule Change - Effective April 1st',
    content: 'Please note that OPD timings for General Medicine and Pediatrics departments have been revised. New timings: Morning 9:00 AM - 1:00 PM, Evening 4:00 PM - 6:00 PM. Emergency services remain 24/7.',
    category: 'SCHEDULE_CHANGE',
    priority: 'MEDIUM',
    publishedAt: '2024-03-28',
    expiresAt: null,
    isPublished: true,
  },
  {
    id: '4',
    title: 'Dengue Prevention Awareness Drive',
    content: 'With the onset of monsoon, the hospital is conducting dengue prevention awareness sessions every Saturday at 10 AM in the OPD waiting area. Free dengue testing available for symptomatic patients.',
    category: 'PUBLIC_HEALTH',
    priority: 'MEDIUM',
    publishedAt: '2024-03-15',
    expiresAt: '2024-06-30',
    isPublished: true,
  },
  {
    id: '5',
    title: 'Tender Notice: Medical Equipment Procurement',
    content: 'Sealed tenders are invited for supply and installation of MRI Machine (1.5T), Digital X-Ray, and Ultrasound Machine. Tender documents available at hospital procurement office.',
    category: 'TENDER',
    priority: 'LOW',
    publishedAt: '2024-03-10',
    expiresAt: '2024-04-30',
    isPublished: true,
  },
];

const categoryStyles = {
  GENERAL: 'bg-gray-100 text-gray-700',
  RECRUITMENT: 'bg-primary-100 text-primary-700',
  TENDER: 'bg-secondary-100 text-secondary-700',
  PUBLIC_HEALTH: 'bg-danger-100 text-danger-700',
  SCHEDULE_CHANGE: 'bg-warning-100 text-warning-700',
  EMERGENCY: 'bg-danger-100 text-danger-700',
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
  MEDIUM: 'bg-warning-100 text-warning-700',
  HIGH: 'bg-danger-100 text-danger-700',
  CRITICAL: 'bg-danger-100 text-danger-700',
};

export function Notices() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary-600" />
              Latest Notices & Announcements
            </h2>
            <p className="text-lg text-gray-600">
              Stay updated with hospital news, schedules, and public health advisories
            </p>
          </div>
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            View All Notices
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.slice(0, 6).map((notice, index) => (
            <article
              key={notice.id}
              className="group p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <categoryIcons[notice.category as keyof typeof categoryIcons] 
                    className={cn('w-5 h-5', categoryStyles[notice.category as keyof typeof categoryStyles])} 
                  />
                  <Badge variant="outline" className={cn(categoryStyles[notice.category as keyof typeof categoryStyles])}>
                    {notice.category.replace('_', ' ')}
                  </Badge>
                </div>
                <Badge variant="outline" className={cn(priorityStyles[notice.priority as keyof typeof priorityStyles])}>
                  {notice.priority}
                </Badge>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {notice.title}
              </h3>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {notice.content}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Published: {formatDate(notice.publishedAt)}
                </span>
                {notice.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires: {formatDate(notice.expiresAt)}
                  </span>
                )}
              </div>

              <Link
                href={`/notices/${notice.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Read More
                <ChevronRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-primary-600 text-primary-600 text-lg font-medium rounded-xl hover:bg-primary-50 transition-all duration-200"
          >
            View All Notices
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-16 grid md:grid-cols-4 gap-4">
          {[
            { icon: FileText, title: 'Circulars', desc: 'Official circulars & orders', href: '/notices?category=GENERAL' },
            { icon: Shield, title: 'Recruitment', desc: 'Job openings & applications', href: '/notices?category=RECRUITMENT' },
            { icon: Megaphone, title: 'Tenders', desc: 'Procurement & tenders', href: '/notices?category=TENDER' },
            { icon: Heart, title: 'Health Advisories', desc: 'Public health notices', href: '/notices?category=PUBLIC_HEALTH' },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
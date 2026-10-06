'use client';

import { useState } from 'react';
import { 
  FileText, AlertTriangle, Shield, Calendar, 
  Clock, ExternalLink, ChevronRight, Bell, 
  Search, Filter, Download, Tag
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@dh-araria/shared/utils';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Table } from '@dh-araria/ui/components';

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
    attachmentUrl: '/notices/health-camp-2024.pdf',
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
    attachmentUrl: '/notices/recruitment-nurses-2024.pdf',
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
    attachmentUrl: '/notices/tender-medical-equipment.pdf',
  },
  {
    id: '6',
    title: 'COVID-19 Vaccination Drive - Booster Dose',
    content: 'Free COVID-19 booster dose vaccination for eligible beneficiaries (18+ years) every Monday and Thursday at the Immunization Center. Bring Aadhaar and previous vaccination certificate.',
    category: 'PUBLIC_HEALTH',
    priority: 'HIGH',
    publishedAt: '2024-03-05',
    expiresAt: '2024-12-31',
    isPublished: true,
  },
  {
    id: '7',
    title: 'Recruitment: Specialist Doctors (Contractual)',
    content: 'Walk-in interview for Specialist Doctors in Cardiology, Neurology, Nephrology, and Oncology on April 20, 2024. Qualification: MD/DM/DNB in respective specialty. Age limit: 65 years.',
    category: 'RECRUITMENT',
    priority: 'HIGH',
    publishedAt: '2024-04-01',
    expiresAt: '2024-04-20',
    isPublished: true,
  },
  {
    id: '8',
    title: 'Monsoon Preparedness Advisory',
    content: 'All departments to ensure drainage clearance, stock essential medicines for water-borne diseases, and maintain 24/7 emergency readiness during monsoon season.',
    category: 'PUBLIC_HEALTH',
    priority: 'MEDIUM',
    publishedAt: '2024-04-05',
    expiresAt: '2024-09-30',
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
  PUBLIC_HEALTH: AlertTriangle,
  SCHEDULE_CHANGE: Calendar,
  EMERGENCY: AlertTriangle,
};

const priorityStyles = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-warning-100 text-warning-700',
  HIGH: 'bg-danger-100 text-danger-700',
  CRITICAL: 'bg-danger-100 text-danger-700',
};

/**
 * Icon tiles for the "Browse by Category" grid.
 *
 * Tailwind scans source files for literal class names, so `bg-${color}-100`
 * would be purged in production and the tiles would render unstyled. The palette
 * therefore has to be spelled out per variant.
 */
const categoryAccentStyles: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-100 text-primary-600',
  secondary: 'bg-secondary-100 text-secondary-600',
  danger: 'bg-danger-100 text-danger-600',
};

const allCategories = ['All', 'GENERAL', 'RECRUITMENT', 'TENDER', 'PUBLIC_HEALTH', 'SCHEDULE_CHANGE', 'EMERGENCY'];

export function NoticesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || notice.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notices by title, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {allCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.replace('_', ' ')}</option>)}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Notices Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredNotices.map((notice, index) => {
            const CategoryIcon = categoryIcons[notice.category as keyof typeof categoryIcons];

            return (
            <article
              key={notice.id}
              className="group p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CategoryIcon
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

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <Link
                  href={`/notices/${notice.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors flex-1 justify-center"
                >
                  Read More
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {notice.attachmentUrl && (
                  <a
                    href={notice.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
              </div>
            </article>
            );
          })}

          {filteredNotices.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Category Quick Links */}
        <div className="border-t border-gray-200 pt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Browse by Category</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: FileText, title: 'General Circulars', desc: 'Official orders & circulars', category: 'GENERAL', color: 'gray' },
              { icon: Shield, title: 'Recruitment', desc: 'Job openings & applications', category: 'RECRUITMENT', color: 'primary' },
              { icon: FileText, title: 'Tenders', desc: 'Procurement & tenders', category: 'TENDER', color: 'secondary' },
              { icon: AlertTriangle, title: 'Health Advisories', desc: 'Public health notices', category: 'PUBLIC_HEALTH', color: 'danger' },
            ].map((item) => {
              const Icon = item.icon;
              // Tailwind's scanner cannot see `bg-${color}-100`, so the palette
              // must be spelled out for each variant.
              const accent = categoryAccentStyles[item.color];

              return (
              <Link
                key={item.category}
                href={`/notices?category=${item.category}`}
                className="group p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform',
                    accent,
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Link>
            );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
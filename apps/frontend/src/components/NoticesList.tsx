'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Bell,
  Search,
  Filter,
  Download,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@dh-araria/shared/utils';
import { cn } from '@dh-araria/shared/utils';
import { Badge, Table } from '@dh-araria/ui/components';
import { api } from '@/lib/api';

interface NoticeSummary {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  publishedAt: string;
  expiresAt?: string | null;
  attachmentUrl?: string | null;
}

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

const allCategories = [
  'All',
  'GENERAL',
  'RECRUITMENT',
  'TENDER',
  'PUBLIC_HEALTH',
  'SCHEDULE_CHANGE',
  'EMERGENCY',
];

export function NoticesList() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  useEffect(() => {
    let cancelled = false;

    api
      .get<NoticeSummary[]>('/notices/published', { limit: 50 })
      .then((response) => {
        if (!cancelled && response.success) setNotices(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotices([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || notice.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notices by title, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Notices Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <p className="col-span-full py-12 text-center text-gray-500">Loading notices…</p>
          )}
          {filteredNotices.map((notice, index) => {
            const CategoryIcon = categoryIcons[notice.category as keyof typeof categoryIcons];

            return (
              <article
                key={notice.id}
                className="group animate-slide-up rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-xl"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      className={cn(
                        'h-5 w-5',
                        categoryStyles[notice.category as keyof typeof categoryStyles]
                      )}
                    />
                    <Badge
                      variant="outline"
                      className={cn(categoryStyles[notice.category as keyof typeof categoryStyles])}
                    >
                      {notice.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(priorityStyles[notice.priority as keyof typeof priorityStyles])}
                  >
                    {notice.priority}
                  </Badge>
                </div>

                <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
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

                <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                  <span className="flex-1 text-sm font-medium text-gray-500">Official Notice</span>
                  {notice.attachmentUrl && (
                    <a
                      href={notice.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  )}
                </div>
              </article>
            );
          })}

          {filteredNotices.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">No notices found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Category Quick Links */}
        <div className="border-t border-gray-200 pt-12">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Browse by Category</h3>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                icon: FileText,
                title: 'General Circulars',
                desc: 'Official orders & circulars',
                category: 'GENERAL',
                color: 'gray',
              },
              {
                icon: Shield,
                title: 'Recruitment',
                desc: 'Job openings & applications',
                category: 'RECRUITMENT',
                color: 'primary',
              },
              {
                icon: FileText,
                title: 'Tenders',
                desc: 'Procurement & tenders',
                category: 'TENDER',
                color: 'secondary',
              },
              {
                icon: AlertTriangle,
                title: 'Health Advisories',
                desc: 'Public health notices',
                category: 'PUBLIC_HEALTH',
                color: 'danger',
              },
            ].map((item) => {
              const Icon = item.icon;
              // Tailwind's scanner cannot see `bg-${color}-100`, so the palette
              // must be spelled out for each variant.
              const accent = categoryAccentStyles[item.color];

              return (
                <Link
                  key={item.category}
                  href={`/notices?category=${item.category}`}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all duration-300 hover:border-primary-200 hover:shadow-lg"
                >
                  <div
                    className={cn(
                      'mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                      accent
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-900">{item.title}</h3>
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

import type { Metadata } from 'next';

import { CITIZEN_MENU, FOOTER_GROUPS, PUBLIC_NAV } from '@/config/navigation';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Sitemap | District Hospital Araria',
  description: 'Sitemap of District Hospital Araria website.',
};

/** Account sub-pages mirror the tab bar on `/account`. */
const ACCOUNT_NAV: Array<{ href: string; label: string }> = [
  { href: '/account', label: 'Appointments' },
  { href: '/account/grievances', label: 'My favourites' },
  { href: '/account/profile', label: 'Profile' },
];

function collectPages(): Array<{ name: string; url: string }> {
  const pages = new Map<string, string>();
  const add = (url: string, name: string) => {
    if (!pages.has(url)) pages.set(url, name);
  };

  PUBLIC_NAV.forEach((link) => add(link.href, link.label));
  CITIZEN_MENU.links.forEach((link) => add(link.href, link.label));
  FOOTER_GROUPS.forEach((group) => group.links.forEach((link) => add(link.href, link.label)));
  ACCOUNT_NAV.forEach((link) => add(link.href, link.label));
  add('/sitemap', 'Sitemap');

  return [...pages.entries()]
    .map(([url, name]) => ({ name, url }))
    .sort((a, b) => a.url.localeCompare(b.url));
}

export default function SitemapPage() {
  const pages = collectPages();

  return (
    <>
      <div>
        <PageBanner
          eyebrow="Directory"
          align="left"
          accent="primary"
          title="Sitemap"
          description="Complete navigation directory for the District Hospital Araria portal."
        />

        <div className="bg-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto space-y-2">
              {pages.map((page) => (
                <div key={page.url} className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <a href={page.url} className="text-primary-700 font-medium hover:text-primary-800 block">
                    {page.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

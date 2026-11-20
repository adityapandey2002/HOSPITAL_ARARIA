import { useMemo } from 'react';
import type { Metadata } from 'next';

import { ACCOUNT_NAV } from '@/components/account/AccountNav';
import { CITIZEN_MENU, FOOTER_GROUPS, PUBLIC_NAV } from '@/config/navigation';

export const metadata: Metadata = {
  title: 'Sitemap | District Hospital Araria',
  description: 'Sitemap of District Hospital Araria website.',
};

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
  const pages = useMemo(collectPages, []);

  return (
    <>
      <div>
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Sitemap</h1>
            <p className="mt-2 text-primary-100">
              Navigation map of the District Hospital Araria website.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
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

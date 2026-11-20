import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false, nocache: true },
};

import { AccountNav } from '@/components/account/AccountNav';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountNav />
      {children}
    </>
  );
}

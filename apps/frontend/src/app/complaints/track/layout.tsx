import type { Metadata } from 'next';

/**
 * The page below is a Client Component (`useState` drives the reference-ID
 * form), and a Client Component cannot export `metadata`. Keeping the metadata
 * here and the interaction in `page.tsx` satisfies both constraints — a
 * `"use client"` page that also exports metadata fails the Turbopack build with
 * "You're importing a module that depends on `useState` into a React Server
 * Component module".
 */
export const metadata: Metadata = {
  title: 'Track Complaint',
  description:
    'Track the status of your complaint at District Hospital Araria using your reference ID.',
};

export default function TrackComplaintLayout({ children }: { children: React.ReactNode }) {
  return children;
}

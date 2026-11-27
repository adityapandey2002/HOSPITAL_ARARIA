import { redirect } from 'next/navigation';

/**
 * Blood availability has been merged into the unified Blood Bank section.
 * Keep this route as a redirect so existing bookmarks and shared links work.
 */
export default function BloodAvailabilityRedirectPage() {
  redirect('/blood-bank');
}

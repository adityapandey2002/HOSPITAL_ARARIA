import { redirect } from 'next/navigation';

/**
 * `/admin` has no dashboard of its own yet; send authorised staff to the
 * complaint desk, which is the most-used admin surface. The admin layout
 * already enforces the role gate, so this redirect only runs for permitted
 * users.
 */
export default function AdminIndexPage() {
  redirect('/admin/complaints');
}

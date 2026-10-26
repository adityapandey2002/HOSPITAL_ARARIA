import { redirect } from 'next/navigation';

/**
 * The grant-level "Nodal Officers" screen was replaced by the staff-centric
 * Staff & Access screen, which creates the account and its grants together.
 * This keeps the old bookmarked URL working.
 */
export default function AdminNodalOfficersPage() {
  redirect('/admin/staff');
}

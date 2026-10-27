import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  CalendarCheck,
  ClipboardList,
  Droplet,
  FileText,
  HeartHandshake,
  HelpCircle,
  Images,
  Hospital,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MessageSquare,
  MessagesSquare,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Trophy,
  UserCog,
  Users,
} from 'lucide-react';
import { UserRole } from '@dh-araria/shared/types';

export interface NavLink {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

/**
 * Every nav surface — desktop bar, mobile drawer, bottom bar, footer, HTML
 * sitemap — renders from this file. A link is only added once its route exists,
 * which is what keeps the "no dead links" gate meaningful.
 */
export const PUBLIC_NAV: NavLink[] = [
  { href: '/', label: 'Home', icon: Hospital },
  { href: '/services', label: 'Services', description: 'Departments, diagnostics and facilities', icon: Stethoscope },
  { href: '/doctors', label: 'Doctors', description: 'Specialists and their OPD days', icon: Users },
  { href: '/appointments', label: 'Appointments', description: 'Book or check an OPD slot', icon: CalendarCheck },
  { href: '/blood-bank', label: 'Blood bank', description: 'Live group availability and donation', icon: Droplet },
  { href: '/notices', label: 'Notices', description: 'Orders, tenders and public notices', icon: Bell },
  { href: '/contact', label: 'Contact', description: 'Phone numbers, address and desk hours', icon: Mail },
];

/** Citizen services: shown in the drawer and the footer, not the desktop bar. */
export const CITIZEN_MENU: NavGroup = {
  title: 'Your voice',
  links: [
    { href: '/complaint', label: 'File a complaint', description: 'Report a service problem', icon: MessageSquare },
    { href: '/complaints/track', label: 'Track a complaint', description: 'Check status with your reference', icon: ClipboardList },
    { href: '/grievances', label: 'Grievance redressal', description: 'Escalate an unresolved issue', icon: MessagesSquare },
    { href: '/feedback', label: 'Share feedback', description: 'Rate your visit or a department', icon: HeartHandshake },
  ],
};

export const FOOTER_GROUPS: NavGroup[] = [
  {
    title: 'Quick links',
    links: [
      { href: '/services', label: 'Services' },
      { href: '/doctors', label: 'Doctors' },
      { href: '/appointments', label: 'Appointments' },
      { href: '/blood-bank', label: 'Blood bank' },
      { href: '/notices', label: 'Notices' },
      { href: '/contact', label: 'Contact us' },
    ],
  },
  {
    title: 'Your voice',
    links: CITIZEN_MENU.links.map(({ href, label }) => ({ href, label })),
  },
  {
    title: 'Patient resources',
    links: [
      { href: '/patient-rights', label: 'Patient rights', icon: ShieldCheck },
      { href: '/insurance', label: 'Insurance & schemes', icon: BadgeCheck },
      { href: '/faqs', label: 'FAQs', icon: HelpCircle },
      { href: '/forms', label: 'Forms', icon: FileText },
      { href: '/health-tips', label: 'Health tips', icon: Activity },
    ],
  },
  {
    title: 'About this portal',
    links: [
      { href: '/accessibility', label: 'Accessibility statement', icon: Info },
      { href: '/privacy', label: 'Privacy policy', icon: ScrollText },
      { href: '/terms', label: 'Terms of use', icon: FileText },
      { href: '/sitemap', label: 'Sitemap', icon: Building2 },
    ],
  },
];

/**
 * Staff navigation. `/admin` and `/admin/grievances` are added in Phase 5 when
 * those pages ship; linking to them now would create dead entries.
 */
export const ADMIN_NAV: Array<NavLink & { roles: UserRole[] }> = [
  {
    href: '/admin/complaints',
    label: 'Complaints',
    description: 'Triage and resolve complainant reports',
    icon: MessagesSquare,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    href: '/feedback/inbox',
    label: 'Feedback inbox',
    description: 'Patient ratings and comments',
    icon: HeartHandshake,
    roles: [UserRole.ADMIN, UserRole.STAFF],
  },
  {
    href: '/admin/doctors',
    label: 'Doctors',
    description: 'Profiles, departments and OPD slots',
    icon: Stethoscope,
    roles: [UserRole.ADMIN],
  },
  {
    href: '/admin/nodal-officers',
    label: 'Nodal officers',
    description: 'Department escalation contacts',
    icon: UserCog,
    roles: [UserRole.ADMIN],
  },
  {
    href: '/admin/slideshow',
    label: 'Slideshow',
    description: 'Homepage slideshow images',
    icon: Images,
    roles: [UserRole.ADMIN],
  },
  {
    href: '/admin/quality-events',
    label: 'Quality events',
    description: 'NQAS, KAYAKALP, MUSQAN progress',
    icon: Trophy,
    roles: [UserRole.ADMIN],
  },
  {
    href: '/admin/staff',
    label: 'Staff access',
    description: 'Accounts and view permissions',
    icon: Users,
    roles: [UserRole.ADMIN],
  },
];

/** Mobile bottom bar: the four tasks citizens actually repeat. */
export const BOTTOM_NAV: NavLink[] = [
  { href: '/', label: 'Home', icon: Hospital },
  { href: '/services', label: 'Services', icon: Stethoscope },
  { href: '/appointments', label: 'Book', icon: CalendarCheck },
  { href: '/blood-bank', label: 'Blood', icon: Droplet },
  { href: '/contact', label: 'Contact', icon: LifeBuoy },
];

export const PRIMARY_ACTION: NavLink = {
  href: '/appointments',
  label: 'Book appointment',
  icon: CalendarCheck,
};

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin links filtered to the signed-in role. */
export function adminNavForRole(role: UserRole | undefined): Array<NavLink & { roles: UserRole[] }> {
  if (!role) return [];
  return ADMIN_NAV.filter((item) => item.roles.includes(role));
}

export const ADMIN_FALLBACK_ICON = LayoutDashboard;

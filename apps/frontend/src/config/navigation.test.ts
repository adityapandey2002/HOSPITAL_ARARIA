import { UserRole } from '@dh-araria/shared';

import { ADMIN_NAV, adminBottomNavForRole, adminNavForRole } from './navigation';

describe('admin navigation', () => {
  it('has one entry per destination', () => {
    const hrefs = ADMIN_NAV.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('trims the mobile bar to the five desk tasks, in order', () => {
    expect(adminBottomNavForRole(UserRole.ADMIN).map((item) => item.label)).toEqual([
      'Complaints',
      'Feedback',
      'Appointments',
      'Notices',
      'Doctors',
    ]);
  });

  it('drops doctors for staff, who cannot run the register', () => {
    expect(adminBottomNavForRole(UserRole.STAFF).map((item) => item.href)).toEqual([
      '/admin/complaints',
      '/feedback/inbox',
      '/admin/appointments',
      '/admin/notices',
    ]);
  });

  it('renders nothing before the role is known', () => {
    expect(adminBottomNavForRole(undefined)).toEqual([]);
    expect(adminNavForRole(undefined)).toEqual([]);
  });
});

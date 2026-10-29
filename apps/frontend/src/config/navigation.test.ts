import { UserRole } from '@dh-araria/shared';

import { ADMIN_NAV, adminBottomNavForRole, adminNavForRole } from './navigation';

describe('admin navigation', () => {
  it('keeps every destination in the sidebar model', () => {
    expect(ADMIN_NAV).toHaveLength(11);
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

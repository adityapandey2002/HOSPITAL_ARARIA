import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMMON_CHECKLIST_DEFAULTS,
  addDaysIsoDate,
  filterDepartmentReports,
  formatDeadlineCountdown,
  getDefaultDepartmentSpecificTasks,
  parseMultilinePointers,
  type DepartmentProgressReport,
} from './quality-events';

test('provides exact department-specific NQAS pointers for Labor Room, MOT, OT, and common departments', () => {
  const lr = getDefaultDepartmentSpecificTasks('NQAS', 'Labor Room');
  assert.ok(lr.includes('The case sheet of the last 60 days is properly audited or not'));
  assert.ok(lr.includes('The ANCOS checklist is filled or not'));
  assert.ok(lr.includes('An action plan is created or not'));

  const mot = getDefaultDepartmentSpecificTasks('NQAS', 'MOT (Minor OT)');
  assert.deepEqual(mot, ['The biomedical waste management register is filled or not']);

  const ot = getDefaultDepartmentSpecificTasks('NQAS', 'OT (Operation Theatre)');
  assert.ok(ot.includes('Prescription record audit done or not'));
  assert.ok(ot.includes('Patient satisfaction analysis done or not and action taken on PSS'));
  assert.ok(ot.includes('Infection control audits done or not'));

  assert.ok(
    COMMON_CHECKLIST_DEFAULTS.NQAS.includes(
      'Quality team meeting register is properly filled or not'
    )
  );
});

test('parseMultilinePointers cleans bullets/numbers and deduplicates lines', () => {
  const raw = `
    - The case sheet of the last 60 days is properly audited or not
    2. The ANCOS checklist is filled or not
    • The ANCOS checklist is filled or not
    ok
    * An action plan is created or not
  `;
  assert.deepEqual(parseMultilinePointers(raw), [
    'The case sheet of the last 60 days is properly audited or not',
    'The ANCOS checklist is filled or not',
    'An action plan is created or not',
  ]);
});

test('formatDeadlineCountdown flags urgent and overdue deadlines accurately', () => {
  assert.deepEqual(formatDeadlineCountdown(null), { label: 'No deadline set', urgent: false });

  const dueToday = formatDeadlineCountdown('2026-11-27', 0, false);
  assert.equal(dueToday.urgent, true);
  assert.match(dueToday.label, /^Due today/);

  const overdue = formatDeadlineCountdown('2026-11-20', -7, true);
  assert.equal(overdue.urgent, true);
  assert.match(overdue.label, /^Overdue by 7d/);

  const comfortable = formatDeadlineCountdown('2026-12-20', 23, false);
  assert.equal(comfortable.urgent, false);
  assert.match(comfortable.label, /^23 days left/);
});

test('addDaysIsoDate returns YYYY-MM-DD shifted by requested days', () => {
  const base = new Date('2026-11-27T12:00:00.000Z');
  assert.equal(addDaysIsoDate(15, base), '2026-12-12');
});

test('filterDepartmentReports filters by readiness level, department name, in-charge name, and pending tasks', () => {
  const reports: DepartmentProgressReport[] = [
    {
      departmentId: 'd-lr',
      departmentName: 'Labor Room',
      total: 4,
      completed: 1,
      pending: 3,
      completionPercent: 25,
      readinessLevel: 'support_required',
      supportReason: 'Low progress (25% done, 3 pending)',
      incharges: [{ id: 'u1', name: 'Sister Rekha Devi', email: 'rekha@dh.in', phone: '9876543210' }],
      pendingTasks: [{ id: 't1', title: 'The ANCOS checklist is filled or not', remarks: null }],
      completedTasks: [],
      lastActivityAt: null,
    },
    {
      departmentId: 'd-ot',
      departmentName: 'OT (Operation Theatre)',
      total: 4,
      completed: 4,
      pending: 0,
      completionPercent: 100,
      readinessLevel: 'ready',
      supportReason: null,
      incharges: [{ id: 'u2', name: 'Dr. Rakesh Kumar', email: 'rakesh@dh.in', phone: null }],
      pendingTasks: [],
      completedTasks: [],
      lastActivityAt: '2026-11-27T08:00:00.000Z',
    },
  ];

  assert.equal(filterDepartmentReports(reports, 'support_required', '').length, 1);
  assert.equal(filterDepartmentReports(reports, 'all', 'rekha')[0]?.departmentId, 'd-lr');
  assert.equal(filterDepartmentReports(reports, 'all', 'ancos')[0]?.departmentId, 'd-lr');
  assert.equal(filterDepartmentReports(reports, 'ready', '').length, 1);
});

import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@dh-araria/shared';

import {
  assessDepartmentReadiness,
  buildDefaultChecklistForDepartment,
  computeDeadlineState,
} from './quality-checklists';
import { QualityEventsService } from './quality-events.service';

describe('quality-checklists pure logic', () => {
  it('assigns Labor Room, MOT, OT, and common NQAS checklist pointers accurately', () => {
    const lr = buildDefaultChecklistForDepartment('NQAS', 'Labor Room');
    expect(lr).toContain('The case sheet of the last 60 days is properly audited or not');
    expect(lr).toContain('The ANCOS checklist is filled or not');
    expect(lr).toContain('An action plan is created or not');
    expect(lr).toContain('Quality team meeting register is properly filled or not');

    const mot = buildDefaultChecklistForDepartment('NQAS', 'MOT (Minor OT)');
    expect(mot).toContain('The biomedical waste management register is filled or not');
    expect(mot).toContain('Quality team meeting register is properly filled or not');
    // MOT should NOT accidentally receive Major OT pointers
    expect(mot).not.toContain('Prescription record audit done or not');

    const ot = buildDefaultChecklistForDepartment('NQAS', 'OT (Operation Theatre)');
    expect(ot).toContain('Prescription record audit done or not');
    expect(ot).toContain('Patient satisfaction analysis done or not and action taken on PSS');
    expect(ot).toContain('Infection control audits done or not');
    expect(ot).toContain('Quality team meeting register is properly filled or not');

    const icu = buildDefaultChecklistForDepartment('NQAS', 'ICU');
    expect(icu).toContain('Quality team meeting register is properly filled or not');
  });

  it('flags departments needing support accurately based on in-charge, progress, and deadline', () => {
    const noIncharge = assessDepartmentReadiness({
      total: 4,
      completed: 2,
      hasIncharge: false,
      daysRemaining: 10,
      isOverdue: false,
    });
    expect(noIncharge.readinessLevel).toBe('support_required');
    expect(noIncharge.supportReason).toMatch(/No department in-charge assigned/i);

    const overdue = assessDepartmentReadiness({
      total: 4,
      completed: 3,
      hasIncharge: true,
      daysRemaining: -1,
      isOverdue: true,
    });
    expect(overdue.readinessLevel).toBe('support_required');

    const ready = assessDepartmentReadiness({
      total: 4,
      completed: 4,
      hasIncharge: true,
      daysRemaining: 2,
      isOverdue: false,
    });
    expect(ready.readinessLevel).toBe('ready');
    expect(ready.completionPercent).toBe(100);
  });

  it('computes deadline countdown and overdue states cleanly', () => {
    const now = new Date('2026-11-27T10:00:00.000Z');
    const in5Days = computeDeadlineState('2026-12-02', now);
    expect(in5Days.isOverdue).toBe(false);
    expect(in5Days.daysRemaining).toBe(5);

    const past = computeDeadlineState('2026-11-20', now);
    expect(past.isOverdue).toBe(true);
    expect((past.daysRemaining ?? 0) < 0).toBe(true);
  });
});

describe('QualityEventsService RBAC enforcement', () => {
  function makeMockDb(responses: unknown[]) {
    let idx = 0;
    const nextResult = () => Promise.resolve(responses[idx++] ?? []);
    const chain: any = {
      select: jest.fn(() => chain),
      from: jest.fn(() => chain),
      where: jest.fn(() => chain),
      limit: jest.fn(() => nextResult()),
      orderBy: jest.fn(() => nextResult()),
      update: jest.fn(() => chain),
      set: jest.fn(() => chain),
      returning: jest.fn(() => nextResult()),
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        nextResult().then(resolve, reject),
    };
    return chain;
  }

  it('forbids a STAFF department in-charge from toggling a task outside their assigned departments', async () => {
    const db = makeMockDb([
      // findById -> active event
      [{ id: 'ev-1', isActive: true, isArchived: false, endDate: null }],
      // task lookup -> belongs to dept-ot
      [{ id: 'task-1', eventId: 'ev-1', departmentId: 'dept-ot', isCompleted: false }],
      // accessibleDepartmentIds -> user is only in-charge of dept-lr
      [{ departmentId: 'dept-lr' }],
    ]);

    const service = new QualityEventsService(db);

    await expect(
      service.completeTask('ev-1', 'task-1', 'staff-1', UserRole.STAFF, true)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids a STAFF in-charge from updating a paused/inactive event', async () => {
    const db = makeMockDb([
      // findById -> inactive event
      [{ id: 'ev-1', isActive: false, isArchived: false, endDate: null }],
      [{ id: 'task-1', eventId: 'ev-1', departmentId: 'dept-lr', isCompleted: false }],
    ]);

    const service = new QualityEventsService(db);

    await expect(
      service.completeTask('ev-1', 'task-1', 'staff-1', UserRole.STAFF, true)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

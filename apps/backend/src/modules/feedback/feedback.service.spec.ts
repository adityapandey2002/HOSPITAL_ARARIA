import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { FeedbackServiceArea, FeedbackStatus, UserRole } from '@dh-araria/shared';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { FeedbackService, type FeedbackActor } from './feedback.service';

type Rows = unknown[][];

/** `jest.fn(() => …)` infers a zero-arg signature; these mocks take arguments. */
type LooseMock = jest.Mock<any, any[]>;

interface BuilderMock {
  from: LooseMock;
  innerJoin: LooseMock;
  leftJoin: LooseMock;
  where: LooseMock;
  groupBy: LooseMock;
  orderBy: LooseMock;
  limit: LooseMock;
  offset: LooseMock;
  values: LooseMock;
  set: LooseMock;
  returning: LooseMock;
  onConflictDoNothing: LooseMock;
}

interface DbMock {
  select: LooseMock;
  insert: LooseMock;
  update: LooseMock;
  delete: LooseMock;
}

/**
 * Each top-level call gets its own builder, so concurrent queries (`findAll`
 * runs the page and the count together) resolve in call order instead of
 * sharing state.
 */
function createDb(rowSets: Rows = []): DbMock {
  const queue = [...rowSets];
  const take = () => Promise.resolve(queue.shift() ?? []);

  const makeBuilder = (): BuilderMock => {
    const builder: BuilderMock = {
      from: jest.fn(() => builder),
      innerJoin: jest.fn(() => builder),
      leftJoin: jest.fn(() => builder),
      where: jest.fn(() => builder),
      groupBy: jest.fn(() => builder),
      orderBy: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      offset: jest.fn(() => builder),
      values: jest.fn(() => builder),
      set: jest.fn(() => builder),
      returning: jest.fn(take),
      onConflictDoNothing: jest.fn(() => builder),
    };

    (builder as unknown as { then: unknown }).then = (
      onFulfilled: (rows: unknown[]) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => take().then(onFulfilled, onRejected);

    return builder;
  };

  return {
    select: jest.fn(() => makeBuilder()),
    insert: jest.fn(() => makeBuilder()),
    update: jest.fn(() => makeBuilder()),
    delete: jest.fn(() => makeBuilder()),
  };
}

/** Collects the bound `Param` values out of a Drizzle SQL condition tree. */
function sqlParams(node: unknown, found: unknown[] = []): unknown[] {
  if (!node || typeof node !== 'object') return found;

  if (Array.isArray(node)) {
    for (const child of node) sqlParams(child, found);
    return found;
  }

  const record = node as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, 'value') && 'encoder' in record) {
    found.push(record.value);
    return found;
  }
  if (Array.isArray(record.queryChunks)) sqlParams(record.queryChunks, found);

  return found;
}

function builderOf(
  db: DbMock,
  kind: 'select' | 'insert' | 'update' | 'delete',
  call: number
): BuilderMock {
  return db[kind].mock.results[call].value as BuilderMock;
}

describe('FeedbackService', () => {
  let service: FeedbackService;
  let db: DbMock;

  async function setup(rowSets: Rows = []) {
    db = createDb(rowSets);
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackService, { provide: DRIZZLE, useValue: db }],
    }).compile();

    service = module.get(FeedbackService);
  }

  const admin: FeedbackActor = { id: 'admin-1', role: UserRole.ADMIN };
  const viewer: FeedbackActor = { id: 'user-1', role: UserRole.STAFF };

  const dto = {
    departmentId: '11111111-1111-4111-8111-111111111111',
    serviceArea: FeedbackServiceArea.OPD,
    rating: 4,
    cleanliness: 5,
    staffBehaviour: 4,
    waitTime: 3,
    comment: 'The OPD queue moved quickly and the staff were courteous.',
    name: 'Asha Devi',
    phone: '+91 98765 43210',
    email: 'asha@example.com',
  };

  describe('create (public)', () => {
    it('mints an id, starts the row in NEW and returns the department name', async () => {
      await setup([
        [{ id: dto.departmentId, name: 'General Medicine', isActive: true }],
        [{ id: 'fb-1', ...dto, status: FeedbackStatus.NEW, createdAt: new Date() }],
      ]);

      const created = await service.create(dto);
      const payload = builderOf(db, 'insert', 0).values.mock.calls[0][0] as Record<string, unknown>;

      expect(payload.id).toEqual(expect.any(String));
      expect(payload.status).toBe(FeedbackStatus.NEW);
      expect(payload.createdAt).toBeInstanceOf(Date);
      expect(payload.email).toBe(dto.email);
      expect(created.departmentName).toBe('General Medicine');
    });

    it('never accepts a caller-supplied status', async () => {
      await setup([
        [{ id: dto.departmentId, name: 'General Medicine', isActive: true }],
        [{ id: 'fb-2' }],
      ]);

      const smuggled = Object.assign({}, dto, { status: FeedbackStatus.RESOLVED });
      await service.create(smuggled);

      const payload = builderOf(db, 'insert', 0).values.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.status).toBe(FeedbackStatus.NEW);
    });

    it('404s and writes nothing when the department does not exist', async () => {
      await setup([[]]);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('404s when the department is inactive', async () => {
      await setup([[{ id: dto.departmentId, name: 'Closed Ward', isActive: false }]]);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('getScope', () => {
    it('gives ADMIN every active department and all: true', async () => {
      await setup([
        [
          { id: 'dept-a', name: 'General Medicine' },
          { id: 'dept-b', name: 'Pediatrics' },
        ],
      ]);

      await expect(service.getScope(admin)).resolves.toEqual({
        all: true,
        departments: [
          { id: 'dept-a', name: 'General Medicine' },
          { id: 'dept-b', name: 'Pediatrics' },
        ],
      });
    });

    it('gives a granted user only their active departments', async () => {
      await setup([[{ departmentId: 'dept-a' }], [{ id: 'dept-a', name: 'General Medicine' }]]);

      await expect(service.getScope(viewer)).resolves.toEqual({
        all: false,
        departments: [{ id: 'dept-a', name: 'General Medicine' }],
      });
    });

    it('returns an empty scope when the user has no grants', async () => {
      await setup([[]]);

      await expect(service.getScope(viewer)).resolves.toEqual({ all: false, departments: [] });
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('lets ADMIN read across departments with paginated meta', async () => {
      await setup([
        [{ id: 'fb-1', departmentId: 'dept-a', departmentName: 'General Medicine' }],
        [{ value: 1 }],
      ]);

      const result = await service.findAll({ page: 1, limit: 10 }, admin);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ departmentName: 'General Medicine' });
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('scopes a viewer to their granted departments', async () => {
      await setup([
        [{ departmentId: 'dept-a' }],
        [{ id: 'fb-1', departmentId: 'dept-a', departmentName: 'General Medicine' }],
        [{ value: 1 }],
      ]);

      const result = await service.findAll({}, viewer);
      const dataQuery = builderOf(db, 'select', 1);

      expect(result.data[0]).toMatchObject({ departmentId: 'dept-a' });
      // The inbox condition must carry the grant, not just the response shape.
      expect(sqlParams(dataQuery.where.mock.calls[0][0])).toContain('dept-a');
      expect(dataQuery.where.mock.calls[0][0]).toBeDefined();
    });

    it('returns an empty page (not an error) when the viewer has no grants', async () => {
      await setup([[]]);

      const result = await service.findAll({ page: 2, limit: 5 }, viewer);

      expect(result).toEqual({ data: [], meta: { page: 2, limit: 5, total: 0, totalPages: 0 } });
      // Only the grant lookup ran; no feedback row could leak.
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('treats a date-only `to` filter as inclusive of the whole day', async () => {
      await setup([[{ departmentId: 'dept-a' }], [{ id: 'fb-1' }], [{ value: 1 }]]);

      await service.findAll({ to: '2026-10-24' }, viewer);

      const params = sqlParams(builderOf(db, 'select', 1).where.mock.calls[0][0]);
      const dates = params.filter((value): value is Date => value instanceof Date);

      expect(dates).toHaveLength(1);
      expect(dates[0].toISOString()).toBe('2026-10-24T23:59:59.999Z');
    });
  });

  describe('updateStatus', () => {
    it('404s before writing when the feedback is gone', async () => {
      await setup([[]]);

      await expect(
        service.updateStatus('missing', FeedbackStatus.ACKNOWLEDGED, admin)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('403s when the viewer has no grant for that department', async () => {
      await setup([[{ id: 'fb-1', departmentId: 'dept-b' }], []]);

      await expect(
        service.updateStatus('fb-1', FeedbackStatus.ACKNOWLEDGED, viewer)
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('lets a granted viewer move the status', async () => {
      await setup([
        [{ id: 'fb-1', departmentId: 'dept-a' }],
        [{ id: 'grant-1' }],
        [{ id: 'fb-1', status: FeedbackStatus.ACKNOWLEDGED }],
      ]);

      const updated = await service.updateStatus('fb-1', FeedbackStatus.ACKNOWLEDGED, viewer);

      expect(updated.status).toBe(FeedbackStatus.ACKNOWLEDGED);
      const set = builderOf(db, 'update', 0).set.mock.calls[0][0] as Record<string, unknown>;
      expect(set.status).toBe(FeedbackStatus.ACKNOWLEDGED);
      expect(set.updatedAt).toBeInstanceOf(Date);
    });

    it('lets ADMIN bypass the grant check entirely', async () => {
      await setup([
        [{ id: 'fb-1', departmentId: 'dept-b' }],
        [{ id: 'fb-1', status: FeedbackStatus.RESOLVED }],
      ]);

      const updated = await service.updateStatus('fb-1', FeedbackStatus.RESOLVED, admin);

      expect(updated.status).toBe(FeedbackStatus.RESOLVED);
      // One read for the row, one write — no feedback_viewers lookup.
      expect(db.select).toHaveBeenCalledTimes(1);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('returns zeroes and an empty department list when the viewer has no access', async () => {
      await setup([[]]);

      await expect(service.getStats({}, viewer)).resolves.toEqual({
        total: 0,
        averageRating: 0,
        averageCleanliness: 0,
        averageStaffBehaviour: 0,
        averageWaitTime: 0,
        byStatus: { NEW: 0, ACKNOWLEDGED: 0, RESOLVED: 0 },
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        byDepartment: [],
      });
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('rounds averages to one decimal and builds the status/rating breakdowns', async () => {
      await setup([
        [{ departmentId: 'dept-a' }],
        [
          {
            total: 3,
            averageRating: '4.5666',
            averageCleanliness: '4.04',
            averageStaffBehaviour: null,
            averageWaitTime: '3.06',
          },
        ],
        [
          { status: FeedbackStatus.NEW, rating: 5, value: 2 },
          { status: FeedbackStatus.RESOLVED, rating: 4, value: 1 },
        ],
        [
          {
            departmentId: 'dept-a',
            departmentName: 'General Medicine',
            total: 3,
            averageRating: '4.6667',
          },
        ],
      ]);

      const stats = await service.getStats({ departmentId: 'dept-a' }, viewer);

      // Select #0 is the grant lookup; #1-#3 are the aggregates.
      for (let call = 1; call <= 3; call += 1) {
        expect(sqlParams(builderOf(db, 'select', call).where.mock.calls[0][0])).toContain('dept-a');
      }

      expect(stats.total).toBe(3);
      expect(stats.averageRating).toBe(4.6);
      expect(stats.averageCleanliness).toBe(4);
      expect(stats.averageStaffBehaviour).toBeNull();
      expect(stats.averageWaitTime).toBe(3.1);
      expect(stats.byStatus).toEqual({ NEW: 2, ACKNOWLEDGED: 0, RESOLVED: 1 });
      expect(stats.ratingDistribution).toEqual({ '1': 0, '2': 0, '3': 0, '4': 1, '5': 2 });
      expect(stats.byDepartment).toEqual([
        {
          departmentId: 'dept-a',
          departmentName: 'General Medicine',
          total: 3,
          averageRating: 4.7,
        },
      ]);
    });
  });

  describe('access grants', () => {
    it('lists grants joined to the user and department, newest first', async () => {
      await setup([
        [
          {
            id: 'grant-1',
            userId: 'user-1',
            userName: 'Asha Devi',
            userEmail: 'asha@example.com',
            departmentId: 'dept-a',
            departmentName: 'General Medicine',
            grantedBy: 'admin-1',
            createdAt: new Date(),
          },
        ],
      ]);

      const grants = await service.listAccess(admin);

      expect(grants).toHaveLength(1);
      expect(grants[0]).toMatchObject({
        userName: 'Asha Devi',
        departmentName: 'General Medicine',
      });
      expect(builderOf(db, 'select', 0).orderBy).toHaveBeenCalled();
    });

    it('refuses grant reads for a non-admin caller', async () => {
      await setup([[]]);

      await expect(service.listAccess(viewer)).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('404s when the user does not exist', async () => {
      await setup([[]]);

      await expect(
        service.createAccess({ userId: 'ghost', departmentIds: ['dept-a'] }, admin)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('refuses to grant feedback access to a patient account', async () => {
      await setup([[{ id: 'user-1', role: UserRole.PATIENT }]]);

      await expect(
        service.createAccess({ userId: 'user-1', departmentIds: ['dept-a'] }, admin)
      ).rejects.toBeInstanceOf(BadRequestException);
      // The role check runs before any department lookup or write.
      expect(db.insert).not.toHaveBeenCalled();
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('404s when any department does not exist', async () => {
      await setup([[{ id: 'user-1' }], [{ id: 'dept-a' }]]);

      await expect(
        service.createAccess({ userId: 'user-1', departmentIds: ['dept-a', 'dept-b'] }, admin)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('inserts idempotently and returns the current grants', async () => {
      await setup([
        [{ id: 'user-1' }],
        [{ id: 'dept-a' }, { id: 'dept-b' }],
        [],
        [
          { id: 'grant-1', userId: 'user-1', departmentId: 'dept-a' },
          { id: 'grant-2', userId: 'user-1', departmentId: 'dept-b' },
        ],
      ]);

      const grants = await service.createAccess(
        { userId: 'user-1', departmentIds: ['dept-a', 'dept-b'] },
        admin
      );

      const insertBuilder = builderOf(db, 'insert', 0);
      const values = insertBuilder.values.mock.calls[0][0] as Array<Record<string, unknown>>;

      expect(insertBuilder.onConflictDoNothing).toHaveBeenCalled();
      expect(values).toHaveLength(2);
      for (const row of values) {
        expect(row.id).toEqual(expect.any(String));
        expect(row.userId).toBe('user-1');
        expect(row.grantedBy).toBe('admin-1');
        expect(row.createdAt).toBeInstanceOf(Date);
      }
      expect(grants).toHaveLength(2);
    });

    it('404s when the grant is already gone', async () => {
      await setup([[]]);

      await expect(service.deleteAccess('missing', admin)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('revokes a grant and reports it', async () => {
      await setup([[{ id: 'grant-1' }]]);

      await expect(service.deleteAccess('grant-1', admin)).resolves.toEqual({ deleted: true });
      expect(db.delete).toHaveBeenCalledTimes(1);
    });
  });
});

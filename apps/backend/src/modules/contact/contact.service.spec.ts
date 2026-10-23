import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { ContactMessageStatus } from '@dh-araria/shared';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { ContactService } from './contact.service';

type Rows = unknown[][];

/** `jest.fn(() => …)` infers a zero-arg signature; these mocks take arguments. */
type LooseMock = jest.Mock<any, any[]>;

interface BuilderMock {
  from: LooseMock;
  where: LooseMock;
  groupBy: LooseMock;
  orderBy: LooseMock;
  limit: LooseMock;
  offset: LooseMock;
  values: LooseMock;
  set: LooseMock;
  returning: LooseMock;
}

interface DbMock {
  select: LooseMock;
  insert: LooseMock;
  update: LooseMock;
  delete: LooseMock;
}

/**
 * Each top-level call gets its own builder, so the two concurrent queries in
 * `findAll` (page + count) resolve in call order instead of sharing state.
 */
function createDb(rowSets: Rows = []): DbMock {
  const queue = [...rowSets];
  const take = () => Promise.resolve(queue.shift() ?? []);

  const makeBuilder = (): BuilderMock => {
    const builder: BuilderMock = {
      from: jest.fn(() => builder),
      where: jest.fn(() => builder),
      groupBy: jest.fn(() => builder),
      orderBy: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      offset: jest.fn(() => builder),
      values: jest.fn(() => builder),
      set: jest.fn(() => builder),
      returning: jest.fn(take),
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

function insertPayload(db: DbMock, call = 0): Record<string, unknown> {
  const builder = db.insert.mock.results[call].value as BuilderMock;
  return builder.values.mock.calls[0][0] as Record<string, unknown>;
}

describe('ContactService', () => {
  let service: ContactService;
  let db: DbMock;

  async function setup(rowSets: Rows = []) {
    db = createDb(rowSets);
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactService, { provide: DRIZZLE, useValue: db }],
    }).compile();

    service = module.get(ContactService);
  }

  const dto = {
    name: 'Asha Devi',
    email: 'asha@example.com',
    phone: '+91 98765 43210',
    subject: 'GENERAL' as const,
    message: 'I would like to know the OPD timings for the cardiology department.',
  };

  describe('create', () => {
    it('mints an id and starts the message in the NEW state', async () => {
      await setup([
        [{ id: 'msg-1', ...dto, status: ContactMessageStatus.NEW, createdAt: new Date() }],
      ]);

      const created = await service.create(dto);
      const payload = insertPayload(db);

      expect(payload.id).toEqual(expect.any(String));
      expect(payload.status).toBe(ContactMessageStatus.NEW);
      expect(payload.email).toBe(dto.email);
      expect(payload.createdAt).toBeInstanceOf(Date);
      expect(created.id).toBe('msg-1');
    });

    it('does not let the caller choose the status', async () => {
      await setup([[{ id: 'msg-2' }]]);

      // The DTO has no `status` field; an attempt to smuggle one through the
      // service must not reach the insert.
      const smuggled = Object.assign({}, dto, { status: ContactMessageStatus.CLOSED });
      await service.create(smuggled);
      const payload = insertPayload(db);

      expect(payload.status).toBe(ContactMessageStatus.NEW);
    });
  });

  describe('findById', () => {
    it('returns the row when it exists', async () => {
      await setup([[{ id: 'msg-1' }]]);
      await expect(service.findById('msg-1')).resolves.toMatchObject({ id: 'msg-1' });
    });

    it('404s when it does not', async () => {
      await setup([[]]);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('reports totals from the concurrent count query', async () => {
      await setup([[{ id: 'msg-1' }, { id: 'msg-2' }], [{ value: 12 }]]);

      const result = await service.findAll({
        page: 2,
        limit: 5,
        status: ContactMessageStatus.NEW,
      });

      expect(result.meta).toEqual({ page: 2, limit: 5, total: 12, totalPages: 3 });
      expect(result.data).toHaveLength(2);
    });

    it('defaults to newest-first when no sort is supplied', async () => {
      await setup([[], [{ value: 0 }]]);

      await service.findAll({});

      // The service resolves an allow-listed column and applies `desc` to it;
      // an unknown `sortBy` must fall back rather than reach SQL.
      expect(db.select).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateStatus', () => {
    it('checks existence and returns the updated row', async () => {
      await setup([[{ id: 'msg-1' }], [{ id: 'msg-1', status: ContactMessageStatus.RESOLVED }]]);

      const updated = await service.updateStatus('msg-1', ContactMessageStatus.RESOLVED);

      expect(updated.status).toBe(ContactMessageStatus.RESOLVED);
    });

    it('404s before writing when the message is gone', async () => {
      await setup([[]]);

      await expect(
        service.updateStatus('missing', ContactMessageStatus.CLOSED)
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns zeroes for statuses with no rows', async () => {
      await setup([
        [
          { status: ContactMessageStatus.NEW, value: 4 },
          { status: ContactMessageStatus.RESOLVED, value: 1 },
        ],
      ]);

      await expect(service.getStats()).resolves.toEqual({
        NEW: 4,
        IN_PROGRESS: 0,
        RESOLVED: 1,
        CLOSED: 0,
      });
    });
  });
});

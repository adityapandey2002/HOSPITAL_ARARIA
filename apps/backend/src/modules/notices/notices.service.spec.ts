import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { NoticesService } from './notices.service';

type Rows = unknown[][];

/** `jest.fn(() => …)` infers a zero-arg signature; these mocks take arguments. */
type LooseMock = jest.Mock<any, any[]>;

interface BuilderMock {
  from: LooseMock;
  where: LooseMock;
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
 * Each top-level call (`select`, `insert`, …) gets its own builder so the two
 * concurrent queries in a paginated read — the page and the count — resolve to
 * their own result set instead of racing on shared state. Queued result sets are
 * consumed in call order.
 */
function createDb(rowSets: Rows = []): DbMock {
  const queue = [...rowSets];

  const take = () => Promise.resolve(queue.shift() ?? []);

  const makeBuilder = (): BuilderMock => {
    const builder: BuilderMock = {
      from: jest.fn(() => builder),
      where: jest.fn(() => builder),
      orderBy: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      offset: jest.fn(() => builder),
      values: jest.fn(() => builder),
      set: jest.fn(() => builder),
      returning: jest.fn(take),
    };

    // Drizzle builders are thenable.
    (builder as unknown as { then: unknown }).then = (
      onFulfilled: (rows: unknown[]) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => take().then(onFulfilled, onRejected);

    return builder;
  };

  const next = () => makeBuilder();

  return {
    select: jest.fn(next),
    insert: jest.fn(next),
    update: jest.fn(next),
    delete: jest.fn(next),
  };
}

/** First argument passed to `values()` on the given top-level mock call. */
function insertPayload(db: DbMock, call = 0): Record<string, unknown> {
  const builder = db.insert.mock.results[call].value as BuilderMock;
  return builder.values.mock.calls[0][0] as Record<string, unknown>;
}

/** First argument passed to `set()` on the given top-level mock call. */
function updatePayload(db: DbMock, call = 0): Record<string, unknown> {
  const builder = db.update.mock.results[call].value as BuilderMock;
  return builder.set.mock.calls[0][0] as Record<string, unknown>;
}

describe('NoticesService', () => {
  let service: NoticesService;

  afterEach(() => jest.clearAllMocks());

  function build(db: DbMock) {
    return Test.createTestingModule({
      providers: [NoticesService, { provide: DRIZZLE, useValue: db }],
    }).compile();
  }

  describe('findPublished', () => {
    it('returns only published, unexpired notices', async () => {
      const db = createDb([[{ id: 'n1', title: 'Camp' }], [{ value: 1 }]]);
      service = (await build(db)).get(NoticesService);

      const result = await service.findPublished({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(db.select).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual([{ id: 'n1', title: 'Camp' }]);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('computes totalPages from the count query', async () => {
      const db = createDb([[], [{ value: 25 }]]);
      service = (await build(db)).get(NoticesService);

      const result = await service.findPublished({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
    });
  });

  describe('create', () => {
    it('stamps publishedAt when publishing immediately', async () => {
      const db = createDb([[{ id: 'n1' }]]);
      service = (await build(db)).get(NoticesService);

      await service.create({ title: 'T', content: 'C', isPublished: true }, 'author-1');

      const payload = insertPayload(db);
      expect(payload.authorId).toBe('author-1');
      expect(payload.publishedAt).toBeInstanceOf(Date);
    });

    it('leaves publishedAt null for a draft', async () => {
      const db = createDb([[{ id: 'n1' }]]);
      service = (await build(db)).get(NoticesService);

      await service.create({ title: 'T', content: 'C', isPublished: false }, 'author-1');

      expect(insertPayload(db).publishedAt).toBeNull();
    });
  });

  describe('update', () => {
    it('rejects non-staff callers before touching the database', async () => {
      const db = createDb();
      service = (await build(db)).get(NoticesService);

      await expect(service.update('n1', {}, 'u1', 'PATIENT')).rejects.toThrow(ForbiddenException);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('sets publishedAt the first time a notice becomes published', async () => {
      const db = createDb([[{ id: 'n1', isPublished: false }], [{ id: 'n1' }]]);
      service = (await build(db)).get(NoticesService);

      await service.update('n1', { isPublished: true }, 'u1', 'STAFF');

      expect(updatePayload(db).publishedAt).toBeInstanceOf(Date);
    });

    it('clears publishedAt when a notice is unpublished', async () => {
      const db = createDb([[{ id: 'n1', isPublished: true }], [{ id: 'n1' }]]);
      service = (await build(db)).get(NoticesService);

      await service.update('n1', { isPublished: false }, 'u1', 'ADMIN');

      expect(updatePayload(db).publishedAt).toBeNull();
    });

    it('404s for a notice that does not exist', async () => {
      const db = createDb([[]]);
      service = (await build(db)).get(NoticesService);

      await expect(service.update('missing', {}, 'u1', 'ADMIN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('refuses deletion by a patient', async () => {
      const db = createDb();
      service = (await build(db)).get(NoticesService);

      await expect(service.delete('n1', 'u1', 'PATIENT')).rejects.toThrow(ForbiddenException);
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('allows staff deletion', async () => {
      const db = createDb([[{ id: 'n1' }]]);
      service = (await build(db)).get(NoticesService);

      await expect(service.delete('n1', 'u1', 'ADMIN')).resolves.toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('taxonomies', () => {
    it('exposes the fixed category and priority lists', async () => {
      service = (await build(createDb())).get(NoticesService);

      await expect(service.getCategories()).resolves.toContain('PUBLIC_HEALTH');
      await expect(service.getPriorities()).resolves.toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    });
  });
});
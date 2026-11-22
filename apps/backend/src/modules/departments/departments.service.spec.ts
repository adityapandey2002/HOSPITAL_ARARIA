import { Test, type TestingModule } from '@nestjs/testing';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { DepartmentsService } from './departments.service';

type Rows = unknown[][];

type LooseMock = jest.Mock<any, any[]>;

interface BuilderMock {
  from: LooseMock;
  leftJoin: LooseMock;
  where: LooseMock;
  groupBy: LooseMock;
  orderBy: LooseMock;
  limit: LooseMock;
  offset: LooseMock;
}

interface DbMock {
  select: LooseMock;
}

/**
 * `then` drains the queued row sets in query order, so the page query and the
 * count query resolve in the order the service issues them.
 */
function createDb(rowSets: Rows = []): DbMock {
  const queue = [...rowSets];
  const take = () => Promise.resolve(queue.shift() ?? []);

  const makeBuilder = (): BuilderMock => {
    const builder: BuilderMock = {
      from: jest.fn(() => builder),
      leftJoin: jest.fn(() => builder),
      where: jest.fn(() => builder),
      groupBy: jest.fn(() => builder),
      orderBy: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      offset: jest.fn(() => builder),
    };

    (builder as unknown as { then: unknown }).then = (
      onFulfilled: (rows: unknown[]) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => take().then(onFulfilled, onRejected);

    return builder;
  };

  return { select: jest.fn(() => makeBuilder()) };
}

function builderOf(db: DbMock, call: number): BuilderMock {
  return db.select.mock.results[call].value as BuilderMock;
}

const medicine = { id: 'dept-1', name: 'General Medicine', isActive: true };
const closedWard = { id: 'dept-2', name: 'Closed Observation Ward', isActive: false };

describe('DepartmentsService directory', () => {
  let service: DepartmentsService;
  let db: DbMock;

  async function setup(rowSets: Rows = []) {
    db = createDb(rowSets);

    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentsService, { provide: DRIZZLE, useValue: db }],
    }).compile();

    service = module.get(DepartmentsService);
  }

  it('filters the public page and its count to active departments', async () => {
    await setup([[medicine], [{ value: 1 }]]);

    const result = await service.findAll({});

    expect(result.data).toEqual([medicine]);
    expect(result.meta).toEqual({ page: 1, limit: 50, total: 1, totalPages: 1 });
    // Both queries must carry the filter, or the total describes a different set
    // than the page it labels.
    for (const call of [0, 1]) {
      const [filter] = builderOf(db, call).where.mock.calls[0];
      expect(filter).toBeDefined();
    }
  });

  it('keeps closed wards in the admin directory', async () => {
    await setup([[medicine, closedWard], [{ value: 2 }]]);

    const result = await service.findAllForAdmin({ page: 2, limit: 10 });

    expect(result.data).toEqual([medicine, closedWard]);
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 2, totalPages: 1 });
    for (const call of [0, 1]) {
      expect(builderOf(db, call).where).toHaveBeenCalledWith(undefined);
    }
  });
});

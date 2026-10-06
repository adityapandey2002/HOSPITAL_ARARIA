import { Test, type TestingModule } from '@nestjs/testing';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { BloodBankService } from './blood-bank.service';

/**
 * The service talks to Drizzle through the `DRIZZLE` token, so the test doubles
 * the query builder rather than the driver. Each `select()` returns a chainable
 * stub, which lets us assert the SQL-shape decisions (filters, ordering,
 * conflict target) without a live PostgreSQL instance.
 */
function createQueryBuilderMock(rows: unknown[]) {
  const builder: Record<string, jest.Mock> = {};

  // Every builder method that is not terminal returns the builder itself, which
  // is what Drizzle's fluent API does.
  const chain = [
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'groupBy',
    'having',
    'values',
    'set',
    'onConflictDoUpdate',
    'limit',
    'offset',
    'orderBy',
  ];

  for (const method of chain) {
    builder[method] = jest.fn(() => builder);
  }

  // Terminal methods resolve to the rows the fake table "contains".
  builder.returning = jest.fn(() => rows);
  builder.then = jest.fn(
    (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  );

  return builder as unknown as {
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    offset: jest.Mock;
    values: jest.Mock;
    set: jest.Mock;
    onConflictDoUpdate: jest.Mock;
    returning: jest.Mock;
  };
}

describe('BloodBankService', () => {
  let service: BloodBankService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BloodBankService, { provide: DRIZZLE, useValue: db }],
    }).compile();

    service = module.get(BloodBankService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getBloodGroups / getComponentTypes', () => {
    it('exposes the eight ABDM blood groups', async () => {
      await expect(service.getBloodGroups()).resolves.toHaveLength(8);
      await expect(service.getBloodGroups()).resolves.toContain('O_NEGATIVE');
    });

    it('exposes every blood component type', async () => {
      await expect(service.getComponentTypes()).resolves.toEqual([
        'WHOLE_BLOOD',
        'PACKED_RED_CELLS',
        'PLATELETS',
        'PLASMA',
        'CRYOPRECIPITATE',
      ]);
    });
  });

  describe('getStockSummary', () => {
    it('nests unit counts by blood group then component', async () => {
      const rows = [
        { bloodGroup: 'O_NEGATIVE', componentType: 'WHOLE_BLOOD', unitsAvailable: 4 },
        { bloodGroup: 'O_NEGATIVE', componentType: 'PLATELETS', unitsAvailable: 2 },
        { bloodGroup: 'A_POSITIVE', componentType: 'PLASMA', unitsAvailable: 7 },
      ];
      db.select.mockReturnValue(createQueryBuilderMock(rows));

      await expect(service.getStockSummary()).resolves.toEqual({
        O_NEGATIVE: { WHOLE_BLOOD: 4, PLATELETS: 2 },
        A_POSITIVE: { PLASMA: 7 },
      });
    });

    it('returns an empty summary when nothing is in stock', async () => {
      db.select.mockReturnValue(createQueryBuilderMock([]));
      await expect(service.getStockSummary()).resolves.toEqual({});
    });
  });

  describe('updateStock', () => {
    it('applies a relative increase to an existing row', async () => {
      db.select.mockReturnValue(createQueryBuilderMock([{ id: 's1', unitsAvailable: 3 }]));
      db.update.mockReturnValue(createQueryBuilderMock([{ id: 's1', unitsAvailable: 5 }]));

      const result = await service.updateStock('O_NEGATIVE', 'WHOLE_BLOOD', 2);

      expect(db.update).toHaveBeenCalledTimes(1);
      expect(result.unitsAvailable).toBe(5);
    });

    it('rejects an issue that would drive stock negative', async () => {
      db.select.mockReturnValue(createQueryBuilderMock([{ id: 's1', unitsAvailable: 1 }]));

      await expect(service.updateStock('O_NEGATIVE', 'WHOLE_BLOOD', -5)).rejects.toThrow(
        /Insufficient stock/,
      );
      expect(db.update).not.toHaveBeenCalled();
    });

    it('inserts a first row instead of failing when no record exists yet', async () => {
      db.select.mockReturnValue(createQueryBuilderMock([]));
      db.insert.mockReturnValue(createQueryBuilderMock([{ id: 'new', unitsAvailable: 6 }]));

      const result = await service.updateStock('A_POSITIVE', 'PLASMA', 6);

      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(result.unitsAvailable).toBe(6);
    });

    it('refuses to create a negative opening balance', async () => {
      db.select.mockReturnValue(createQueryBuilderMock([]));

      await expect(service.updateStock('A_POSITIVE', 'PLASMA', -1)).rejects.toThrow(
        /does not exist/,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('setStock', () => {
    it('upserts on the (bloodGroup, componentType) unique key', async () => {
      db.insert.mockReturnValue(createQueryBuilderMock([{ id: 's1', unitsAvailable: 10 }]));

      await service.setStock('B_POSITIVE', 'PLATELETS', 10);

      const builder = db.insert();
      expect(builder.onConflictDoUpdate).toHaveBeenCalledTimes(1);
      expect(builder.onConflictDoUpdate.mock.calls[0][0].target).toHaveLength(2);
    });

    it('rejects negative absolute values', async () => {
      await expect(service.setStock('B_POSITIVE', 'PLATELETS', -1)).rejects.toThrow(
        /Units cannot be negative/,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
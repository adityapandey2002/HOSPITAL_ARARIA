import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { UserRole } from '@dh-araria/shared';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { AdminService } from './admin.service';

type Rows = unknown[][];

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
  transaction: LooseMock;
}

/**
 * Each top-level call gets its own builder. `then` drains the shared row-set
 * queue in resolution order, so sequential queries behave like real Drizzle.
 * `transaction` simply runs the callback against the same mock.
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

  const db: DbMock = {
    select: jest.fn(() => makeBuilder()),
    insert: jest.fn(() => makeBuilder()),
    update: jest.fn(() => makeBuilder()),
    delete: jest.fn(() => makeBuilder()),
    transaction: jest.fn(),
  };
  db.transaction.mockImplementation((fn: (tx: DbMock) => unknown) => fn(db));

  return db;
}

function builderOf(
  db: DbMock,
  kind: 'select' | 'insert' | 'update' | 'delete',
  call: number
): BuilderMock {
  return db[kind].mock.results[call].value as BuilderMock;
}

const staffRow = {
  id: 'staff-1',
  name: 'Asha Kumari',
  email: 'asha@dhararia.gov.in',
  phone: null,
  role: UserRole.STAFF,
  isActive: true,
  createdAt: new Date('2026-10-26T09:00:00Z'),
  updatedAt: new Date('2026-10-26T09:00:00Z'),
};

const generalMedicine = { id: 'dept-1', name: 'General Medicine' };
const emergency = { id: 'dept-2', name: 'Emergency Medicine' };

const createDto = {
  name: 'Asha Kumari',
  email: 'asha@dhararia.gov.in',
  password: 'Asha@2026',
  departmentIds: ['dept-1'],
};

describe('AdminService staff accounts', () => {
  let service: AdminService;
  let db: DbMock;

  async function setup(rowSets: Rows = []) {
    db = createDb(rowSets);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: DRIZZLE, useValue: db }],
    }).compile();

    service = module.get(AdminService);
  }

  describe('createStaff', () => {
    it('hashes the password and writes the STAFF account with its grants', async () => {
      await setup([
        [], // email lookup: no clash
        [generalMedicine], // department lookup
        [], // insert users
        [], // insert grants
        [staffRow], // getStaff row
        [generalMedicine], // getStaff grants
      ]);

      const created = await service.createStaff(createDto, 'admin-1');

      expect(created).toEqual({
        ...staffRow,
        role: UserRole.STAFF,
        departments: [generalMedicine],
      });

      const userInsert = builderOf(db, 'insert', 0);
      const values = userInsert.values.mock.calls[0][0];
      expect(values).toEqual(
        expect.objectContaining({
          name: 'Asha Kumari',
          email: 'asha@dhararia.gov.in',
          role: UserRole.STAFF,
          isActive: true,
        })
      );
      // The plaintext password must never reach the database.
      expect(values.password).not.toBe(createDto.password);
      await expect(bcrypt.compare(createDto.password, values.password)).resolves.toBe(true);

      // The grants must hang off the id the service just generated, not any
      // caller-supplied value.
      const grantInsert = builderOf(db, 'insert', 1);
      expect(grantInsert.values).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: values.id,
          departmentId: generalMedicine.id,
          grantedBy: 'admin-1',
        }),
      ]);
    });

    it('rejects an email that is already registered', async () => {
      await setup([[{ id: 'someone-else' }]]);

      await expect(service.createStaff(createDto, 'admin-1')).rejects.toBeInstanceOf(
        ConflictException
      );

      expect(db.insert).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('rejects departments that do not exist before writing anything', async () => {
      await setup([
        [], // email is free
        [], // no matching departments
      ]);

      await expect(service.createStaff(createDto, 'admin-1')).rejects.toBeInstanceOf(
        BadRequestException
      );

      expect(db.insert).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });
  });

  describe('updateStaff', () => {
    it('replaces the grant set instead of appending to it', async () => {
      await setup([
        [{ id: staffRow.id, role: UserRole.STAFF, email: staffRow.email }], // target
        [emergency], // departments to keep
        [], // update users
        [{ departmentId: generalMedicine.id }], // current grants
        [], // delete revoked grant
        [], // insert added grant
        [staffRow], // getStaff row
        [emergency], // getStaff grants
      ]);

      const updated = await service.updateStaff(
        staffRow.id,
        { name: 'Asha Kumari', departmentIds: [emergency.id] },
        'admin-1'
      );

      expect(updated.departments).toEqual([emergency]);
      expect(db.delete).toHaveBeenCalledTimes(1);

      const grantInsert = builderOf(db, 'insert', 0);
      expect(grantInsert.values).toHaveBeenCalledWith([
        expect.objectContaining({ userId: staffRow.id, departmentId: emergency.id }),
      ]);
    });

    it('leaves grants untouched when departmentIds is omitted', async () => {
      await setup([
        [{ id: staffRow.id, role: UserRole.STAFF, email: staffRow.email }],
        [], // update users
        [staffRow], // getStaff row
        [generalMedicine], // getStaff grants
      ]);

      await service.updateStaff(staffRow.id, { name: 'Asha K.' }, 'admin-1');

      expect(db.delete).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('refuses to edit an account that is not STAFF', async () => {
      await setup([[{ id: 'admin-1', role: UserRole.ADMIN, email: 'admin@dhararia.gov.in' }]]);

      await expect(
        service.updateStaff('admin-1', { name: 'Someone' }, 'admin-1')
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(db.update).not.toHaveBeenCalled();
    });

    it('404s for an unknown staff id', async () => {
      await setup([[]]);

      await expect(
        service.updateStaff('missing', { name: 'Nobody' }, 'admin-1')
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

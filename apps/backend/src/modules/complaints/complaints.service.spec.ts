import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { ComplaintStatus, UserRole } from '@dh-araria/shared';

import { DRIZZLE } from '../../common/drizzle/drizzle.module';
import { NotificationsService } from '../notifications/notifications.service';
import { ComplaintsService } from './complaints.service';

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
 * queue in resolution order, so concurrent selects behave like real Drizzle.
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

const department = { id: 'dept-1', name: 'General Medicine', isActive: true };

const complaint = {
  id: 'complaint-1',
  userId: null,
  name: 'Test Citizen',
  email: '',
  phone: '',
  departmentId: 'dept-1',
  category: 'OTHER',
  subject: 'Complaint - General Medicine',
  description: 'The pharmacy ran out of my medicine.',
  status: 'SUBMITTED',
  complaintStatus: ComplaintStatus.SUBMITTED,
  imageUrl: null,
  cpgramsId: null,
  assignedTo: null,
  resolution: null,
  createdAt: new Date('2026-10-26T09:00:00Z'),
  updatedAt: new Date('2026-10-26T09:00:00Z'),
};

const historyEntry = {
  id: 'history-1',
  complaintId: 'complaint-1',
  fromStatus: null,
  toStatus: ComplaintStatus.SUBMITTED,
  resolution: null,
  changedBy: null,
  changedByName: 'Test Citizen',
  changedByRole: null,
  createdAt: new Date('2026-10-26T09:00:00Z'),
};

describe('ComplaintsService', () => {
  let service: ComplaintsService;
  let db: DbMock;
  let notifications: { notifyStatusChange: jest.Mock };

  async function setup(rowSets: Rows = []) {
    db = createDb(rowSets);
    notifications = { notifyStatusChange: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: DRIZZLE, useValue: db },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ComplaintsService);
  }

  it('records the initial SUBMITTED entry when a citizen submits', async () => {
    await setup([[department], [complaint]]);

    const created = await service.create({
      name: 'Test Citizen',
      departmentId: 'dept-1',
      complaint: 'The pharmacy ran out of my medicine.',
    });

    expect(created.id).toBe('complaint-1');

    const historyInsert = builderOf(db, 'insert', 1);
    expect(historyInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        complaintId: 'complaint-1',
        fromStatus: null,
        toStatus: ComplaintStatus.SUBMITTED,
        changedBy: null,
        changedByName: 'Test Citizen',
      })
    );
  });

  it('records who moved a complaint and from which status', async () => {
    await setup([
      [{ ...complaint, complaintStatus: ComplaintStatus.UNDER_REVIEW }], // findById row
      [{ departmentId: 'dept-1' }], // findById department scope check
      [historyEntry], // findById -> getHistory
      [{ departmentId: 'dept-1' }], // updateStatus department scope check
      [{ ...complaint, complaintStatus: ComplaintStatus.IN_PROGRESS }], // update returning
    ]);

    await service.updateStatus(
      'complaint-1',
      ComplaintStatus.IN_PROGRESS,
      'staff-1',
      UserRole.STAFF,
      'Asha Kumari'
    );

    const historyInsert = builderOf(db, 'insert', 0);
    expect(historyInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        complaintId: 'complaint-1',
        fromStatus: ComplaintStatus.UNDER_REVIEW,
        toStatus: ComplaintStatus.IN_PROGRESS,
        changedBy: 'staff-1',
        changedByName: 'Asha Kumari',
        changedByRole: UserRole.STAFF,
      })
    );
    expect(notifications.notifyStatusChange).toHaveBeenCalled();
  });

  it('refuses a status change for a department the staff member was not granted', async () => {
    await setup([
      [complaint], // findById row
      [{ departmentId: 'dept-2' }], // staff only holds Emergency Medicine
      [historyEntry], // never reached: the scope check throws first
    ]);

    await expect(
      service.updateStatus(
        'complaint-1',
        ComplaintStatus.RESOLVED,
        'staff-1',
        UserRole.STAFF,
        'Asha Kumari'
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(db.update).not.toHaveBeenCalled();
    expect(notifications.notifyStatusChange).not.toHaveBeenCalled();
  });

  it('attaches a displayable photo to an existing complaint', async () => {
    const dataUrl = 'data:image/jpeg;base64,abc';
    await setup([
      [complaint], // findById row
      [historyEntry], // findById -> getHistory
      [{ ...complaint, imageUrl: dataUrl }], // update returning
    ]);

    const updated = await service.updatePhoto(
      'complaint-1',
      dataUrl,
      'admin-1',
      UserRole.ADMIN
    );

    expect(updated.imageUrl).toBe(dataUrl);
    expect(builderOf(db, 'update', 0).set).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: dataUrl })
    );
  });

  it('refuses a photo change for a department the staff member was not granted', async () => {
    await setup([
      [complaint], // findById row
      [{ departmentId: 'dept-2' }], // staff only holds Emergency Medicine
      [historyEntry], // never reached: the scope check throws first
    ]);

    await expect(
      service.updatePhoto(
        'complaint-1',
        'data:image/jpeg;base64,abc',
        'staff-1',
        UserRole.STAFF
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(db.update).not.toHaveBeenCalled();
  });

  it('never stores a blob photo on an existing complaint', async () => {
    await setup([[complaint], [historyEntry]]);

    await expect(
      service.updatePhoto(
        'complaint-1',
        'blob:http://localhost:3000/dead',
        'admin-1',
        UserRole.ADMIN
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns the timeline with each complaint in the list', async () => {
    await setup([[complaint], [{ value: 1 }], [historyEntry]]);

    const result = await service.findAll({ page: 1, limit: 10 }, {}, 'admin-1', UserRole.ADMIN);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].history).toEqual([historyEntry as never]);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('drops a blob: photo instead of storing a URL that dies with the tab', async () => {
    await setup([[department], [complaint]]);

    await service.create({
      name: 'Test Citizen',
      departmentId: 'dept-1',
      complaint: 'The pharmacy ran out of my medicine.',
      imageUrl: 'blob:http://localhost:3000/4c2da3ca-ad2d-4ac6-8356-1ce73c12eb28',
    });

    const complaintInsert = builderOf(db, 'insert', 0);
    expect(complaintInsert.values.mock.calls[0][0]).toEqual(
      expect.objectContaining({ imageUrl: null })
    );
  });

  it('keeps a stored photo and hides legacy blob references in the list', async () => {
    const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

    await setup([
      [
        { ...complaint, imageUrl: photo },
        { ...complaint, id: 'complaint-2', imageUrl: 'blob:http://localhost:3000/dead' },
      ],
      [{ value: 2 }],
      [historyEntry, { ...historyEntry, id: 'history-2', complaintId: 'complaint-2' }],
    ]);

    const result = await service.findAll({ page: 1, limit: 10 }, {}, 'admin-1', UserRole.ADMIN);

    expect(result.data[0].imageUrl).toBe(photo);
    expect(result.data[1].imageUrl).toBeNull();
  });
});

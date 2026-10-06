import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { AuditLogService } from '../../common/audit/audit-log.service';
import { ENTITY_MANAGER } from '../../common/mikro/mikro.module';

import { AbdmService } from './abdm.service';

/**
 * The consent gate is the single most compliance-sensitive branch in the
 * codebase: ABDM M3 forbids disclosing health records without a GRANTED,
 * unexpired consent artefact. These tests pin that behaviour down.
 */
describe('AbdmService consent gating', () => {
  const NOW = new Date('2026-06-01T00:00:00.000Z');

  let service: AbdmService;
  let em: {
    findOne: jest.Mock;
    find: jest.Mock;
    flush: jest.Mock;
    count: jest.Mock;
    nativeDelete: jest.Mock;
    transactional: jest.Mock;
  };
  let audit: { log: jest.Mock; logWith: jest.Mock };

  function grant(overrides: Record<string, unknown> = {}) {
    return {
      id: 'consent-row',
      consentId: 'CONSENT-1',
      patientId: 'patient-1',
      status: 'GRANTED',
      dateRangeStart: new Date('2026-01-01T00:00:00.000Z'),
      dateRangeEnd: new Date('2026-12-31T00:00:00.000Z'),
      dataEraseAt: new Date('2027-03-31T00:00:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      flush: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      nativeDelete: jest.fn().mockResolvedValue(0),
      // The Unit of Work hands the callback its own manager; the tests only care
      // about the domain logic, not the transactional plumbing.
      transactional: jest.fn(async (fn: (em: unknown) => Promise<unknown>) => fn(em)),
    };

    audit = { log: jest.fn(), logWith: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbdmService,
        { provide: ENTITY_MANAGER, useValue: em },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get(AbdmService);

    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('getRecordsForConsent', () => {
    it('returns bundles and records the disclosure when consent is valid', async () => {
      em.findOne.mockResolvedValue(grant());
      em.find.mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]);

      const result = await service.getRecordsForConsent('patient-1', 'CONSENT-1');

      expect(result.consent.consentId).toBe('CONSENT-1');
      expect(result.bundles).toHaveLength(2);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FHIR_RECORDS_DISCLOSED',
          resourceId: 'consent-row',
          details: { consentId: 'CONSENT-1', bundleCount: 2 },
        }),
      );
    });

    it('404s when no artefact matches the patient and consent id', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(service.getRecordsForConsent('patient-1', 'MISSING')).rejects.toThrow(
        NotFoundException,
      );
      expect(em.find).not.toHaveBeenCalled();
    });

    it.each(['PENDING', 'DENIED', 'REVOKED', 'EXPIRED'])(
      'refuses disclosure when consent is %s',
      async (status) => {
        em.findOne.mockResolvedValue(grant({ status }));

        await expect(service.getRecordsForConsent('patient-1', 'CONSENT-1')).rejects.toThrow(
          new RegExp(`Consent is ${status}`),
        );
        expect(em.find).not.toHaveBeenCalled();
      },
    );

    it('refuses disclosure after the consent window has closed', async () => {
      em.findOne.mockResolvedValue(
        grant({ dateRangeEnd: new Date('2026-05-01T00:00:00.000Z') }),
      );

      await expect(service.getRecordsForConsent('patient-1', 'CONSENT-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(em.find).not.toHaveBeenCalled();
    });

    it('marks the artefact EXPIRED when it is read past its window', async () => {
      em.findOne.mockResolvedValue(
        grant({ dateRangeEnd: new Date('2026-05-01T00:00:00.000Z') }),
      );

      await expect(
        service.getRecordsForConsent('patient-1', 'CONSENT-1'),
      ).rejects.toThrow(ForbiddenException);

      // The status change is persisted, so the expiry is not re-evaluated per read.
      expect(em.flush).toHaveBeenCalled();
    });

    it('only returns bundles inside the consent date range', async () => {
      em.findOne.mockResolvedValue(grant());
      em.find.mockResolvedValue([]);

      await service.getRecordsForConsent('patient-1', 'CONSENT-1');

      const [entity, where] = em.find.mock.calls[0];
      expect(entity).toBeDefined();
      expect(where).toMatchObject({
        patientId: 'patient-1',
        createdAt: {
          $gte: grant().dateRangeStart,
          $lte: grant().dateRangeEnd,
        },
      });
    });
  });

  describe('recordBundle', () => {
    it('refuses to attach records to a closed care context', async () => {
      // findOne is called for the CareContext lookup.
      em.findOne.mockResolvedValue({ id: 'cc-1', status: 'COMPLETED' });

      await expect(
        service.recordBundle({
          bundleId: 'B1',
          bundleType: 'document',
          patientId: 'patient-1',
          careContextId: 'cc-1',
          fhirJson: { resourceType: 'Bundle' },
        }),
      ).rejects.toThrow(/closed care context/);
    });

    it('404s when the referenced care context does not exist', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.recordBundle({
          bundleId: 'B1',
          bundleType: 'document',
          patientId: 'patient-1',
          careContextId: 'missing',
          fhirJson: { resourceType: 'Bundle' },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findErasableRecords', () => {
    it('returns artefacts whose ABDM erasure deadline has passed', async () => {
      em.find.mockResolvedValue([{ consentId: 'OLD-1' }]);

      const result = await service.findErasableRecords(NOW);

      expect(em.find).toHaveBeenCalledWith(expect.anything(), {
        dataEraseAt: { $lt: NOW },
      });
      expect(result).toHaveLength(1);
    });
  });
});
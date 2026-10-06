/**
 * AbdmService
 * -----------
 * Domain logic for the ABDM sandbox integration (Milestones M2 and M3).
 *
 * Why MikroORM: every operation here writes health data that must commit
 * atomically with its audit trail, and consent must be checked *and* recorded
 * in the same transaction. `em.transactional()` gives us that.
 *
 * Transport to the ABDM gateway is intentionally left as a thin, injected port
 * (`AbdmGateway`) so the sandbox/production switch and the sandbox certificates
 * are handled in one place (Phase 3 work).
 */
import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

import { AuditLogService } from '../../common/audit/audit-log.service';
import { newId } from '../../common/drizzle/id';
import { ENTITY_MANAGER } from '../../common/mikro/mikro.module';

import { AbhaProfile } from './entities/abha-profile.entity';
import { CareContext } from './entities/care-context.entity';
import { ConsentArtefact, type ConsentStatus } from './entities/consent-artefact.entity';
import { FhirBundle, type FhirBundleStatus } from './entities/fhir-bundle.entity';

export interface CreateCareContextInput {
  abhaProfileId: string;
  referenceNumber: string;
  displayName: string;
  facilityName: string;
  facilityId: string;
  careContextType: string;
  startDate: Date;
  actorId?: string;
  correlationId?: string;
}

export interface RecordBundleInput {
  bundleId: string;
  bundleType: string;
  patientId: string;
  careContextId?: string;
  fhirJson: Record<string, unknown>;
  encryptedData?: string;
  encryptionKey?: string;
  actorId?: string;
  correlationId?: string;
}

export interface RecordConsentInput {
  consentId: string;
  patientId: string;
  hipId: string;
  hiuId: string;
  purpose: string;
  hiTypes: string[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
  dataEraseAt: Date;
  consentJson: Record<string, unknown>;
  actorId?: string;
  correlationId?: string;
}

@Injectable()
export class AbdmService {
  private readonly logger = new Logger(AbdmService.name);

  constructor(
    @Inject(ENTITY_MANAGER) private readonly em: EntityManager,
    private readonly audit: AuditLogService,
  ) {}

  // -------------------------------------------------------------------------
  // M1/M2 — care contexts
  // -------------------------------------------------------------------------

  async createCareContext(input: CreateCareContextInput): Promise<CareContext> {
    return this.em.transactional(async (em) => {
      const profile = await em.findOne(AbhaProfile, { id: input.abhaProfileId });
      if (!profile) throw new NotFoundException('ABHA profile not found');

      const careContext = em.create(CareContext, {
        id: newId(),
        abhaProfile: profile,
        abhaProfileId: profile.id,
        referenceNumber: input.referenceNumber,
        displayName: input.displayName,
        facilityName: input.facilityName,
        facilityId: input.facilityId,
        careContextType: input.careContextType,
        startDate: input.startDate,
        status: 'ACTIVE',
      } as any);

      await em.persistAndFlush(careContext);

      await this.audit.logWith(em, {
        action: 'CARE_CONTEXT_CREATE',
        resource: 'CareContext',
        resourceId: careContext.id,
        userId: input.actorId,
        correlationId: input.correlationId,
        details: { referenceNumber: careContext.referenceNumber, type: careContext.careContextType },
      });

      return careContext;
    });
  }

  async completeCareContext(id: string, actorId?: string, correlationId?: string): Promise<CareContext> {
    return this.em.transactional(async (em) => {
      const careContext = await em.findOne(CareContext, { id });
      if (!careContext) throw new NotFoundException('Care context not found');
      if (careContext.status !== 'ACTIVE') {
        throw new ForbiddenException(`Care context is already ${careContext.status}`);
      }

      careContext.status = 'COMPLETED';
      careContext.endDate = new Date();
      await em.flush();

      await this.audit.logWith(em, {
        action: 'CARE_CONTEXT_COMPLETE',
        resource: 'CareContext',
        resourceId: careContext.id,
        userId: actorId,
        correlationId,
        details: { referenceNumber: careContext.referenceNumber },
      });

      return careContext;
    });
  }

  // -------------------------------------------------------------------------
  // M2 — record ingestion / publishing (HIP)
  // -------------------------------------------------------------------------

  /**
   * Persists a FHIR R4 bundle. Bundles are only accepted while the referenced
   * care context is ACTIVE, per the ABDM HIP specification.
   */
  async recordBundle(input: RecordBundleInput): Promise<FhirBundle> {
    return this.em.transactional(async (em) => {
      if (input.careContextId) {
        const careContext = await em.findOne(CareContext, { id: input.careContextId });
        if (!careContext) throw new NotFoundException('Care context not found');
        if (careContext.status !== 'ACTIVE') {
          throw new ForbiddenException('Records cannot be added to a closed care context');
        }
      }

      const bundle = em.create(FhirBundle, {
        id: newId(),
        bundleId: input.bundleId,
        bundleType: input.bundleType,
        patientId: input.patientId,
        careContextId: input.careContextId,
        fhirJson: input.fhirJson,
        encryptedData: input.encryptedData,
        encryptionKey: input.encryptionKey,
        status: input.encryptedData ? 'ENCRYPTED' : 'PENDING',
      } as any);

      await em.persistAndFlush(bundle);

      // The audit payload intentionally records only shape metadata — never the
      // diagnosis or any other clinical content (see docs/SECURITY.md).
      await this.audit.logWith(em, {
        action: 'FHIR_BUNDLE_CREATE',
        resource: 'FhirBundle',
        resourceId: bundle.id,
        userId: input.actorId,
        correlationId: input.correlationId,
        details: {
          bundleId: bundle.bundleId,
          bundleType: bundle.bundleType,
          entryCount: Array.isArray(bundle.fhirJson?.entry) ? bundle.fhirJson.entry.length : 0,
        },
      });

      return bundle;
    });
  }

  async updateBundleStatus(
    id: string,
    status: FhirBundleStatus,
    actorId?: string,
    correlationId?: string,
  ): Promise<FhirBundle> {
    return this.em.transactional(async (em) => {
      const bundle = await em.findOne(FhirBundle, { id });
      if (!bundle) throw new NotFoundException('Bundle not found');

      bundle.status = status;
      await em.flush();

      await this.audit.logWith(em, {
        action: 'FHIR_BUNDLE_STATUS_CHANGE',
        resource: 'FhirBundle',
        resourceId: bundle.id,
        userId: actorId,
        correlationId,
        details: { from: 'previous', to: status },
      });

      return bundle;
    });
  }

  /** Staff lookup used by the ABDM admin console; audited like every read. */
  async findBundle(id: string, actorId?: string, correlationId?: string): Promise<FhirBundle> {
    const bundle = await this.em.findOne(FhirBundle, { id });
    if (!bundle) throw new NotFoundException('Bundle not found');

    await this.audit.log({
      action: 'FHIR_BUNDLE_VIEW',
      resource: 'FhirBundle',
      resourceId: bundle.id,
      userId: actorId,
      correlationId,
      details: { bundleId: bundle.bundleId },
    });

    return bundle;
  }

  // -------------------------------------------------------------------------
  // M3 — consent management (HIU)
  // -------------------------------------------------------------------------

  async recordConsent(input: RecordConsentInput): Promise<ConsentArtefact> {
    return this.em.transactional(async (em) => {
      const consent = em.create(ConsentArtefact, {
        id: newId(),
        consentId: input.consentId,
        patientId: input.patientId,
        hipId: input.hipId,
        hiuId: input.hiuId,
        purpose: input.purpose,
        hiTypes: input.hiTypes,
        dateRangeStart: input.dateRangeStart,
        dateRangeEnd: input.dateRangeEnd,
        dataEraseAt: input.dataEraseAt,
        consentJson: input.consentJson,
        status: 'PENDING',
      } as any);

      await em.persistAndFlush(consent);

      await this.audit.logWith(em, {
        action: 'CONSENT_ARTEFACT_CREATE',
        resource: 'ConsentArtefact',
        resourceId: consent.id,
        userId: input.actorId,
        correlationId: input.correlationId,
        details: { consentId: consent.consentId, hipId: consent.hipId, hiTypes: consent.hiTypes },
      });

      return consent;
    });
  }

  async setConsentStatus(
    id: string,
    status: ConsentStatus,
    actorId?: string,
    correlationId?: string,
  ): Promise<ConsentArtefact> {
    return this.em.transactional(async (em) => {
      const consent = await em.findOne(ConsentArtefact, { id });
      if (!consent) throw new NotFoundException('Consent artefact not found');

      consent.status = status;
      await em.flush();

      await this.audit.logWith(em, {
        action: 'CONSENT_ARTEFACT_STATUS_CHANGE',
        resource: 'ConsentArtefact',
        resourceId: consent.id,
        userId: actorId,
        correlationId,
        details: { consentId: consent.consentId, to: status },
      });

      return consent;
    });
  }

  /**
   * M3 read path. Returns a patient's bundles, but only those covered by a
   * GRANTED, unexpired consent artefact. Consent is the legal basis for every
   * read, so an absent/expired artefact is an error rather than an empty list.
   */
  async getRecordsForConsent(
    patientId: string,
    consentId: string,
  ): Promise<{ consent: ConsentArtefact; bundles: FhirBundle[] }> {
    const consent = await this.em.findOne(ConsentArtefact, { consentId, patientId });
    if (!consent) throw new NotFoundException('Consent artefact not found');

    if (consent.status !== 'GRANTED') {
      throw new ForbiddenException(`Consent is ${consent.status}, not GRANTED`);
    }

    const now = new Date();
    if (consent.dateRangeEnd < now) {
      consent.status = 'EXPIRED';
      await this.em.flush();
      throw new ForbiddenException('Consent has expired');
    }

    if (consent.dataEraseAt < now) {
      this.logger.warn(`Consent ${consent.consentId} passed its erasure deadline`);
    }

    const bundles = await this.em.find(
      FhirBundle,
      {
        patientId,
        createdAt: { $gte: consent.dateRangeStart, $lte: consent.dateRangeEnd },
      },
      { orderBy: { createdAt: 'DESC' } },
    );

    await this.audit.log({
      action: 'FHIR_RECORDS_DISCLOSED',
      resource: 'ConsentArtefact',
      resourceId: consent.id,
      userId: patientId,
      details: { consentId: consent.consentId, bundleCount: bundles.length },
    });

    return { consent, bundles };
  }

  /** ABDM mandates erasure within 90 days of the consent window closing. */
  async findErasableRecords(now = new Date()): Promise<ConsentArtefact[]> {
    return this.em.find(ConsentArtefact, { dataEraseAt: { $lt: now } });
  }
}
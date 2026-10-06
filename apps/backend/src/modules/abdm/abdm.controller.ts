import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AbdmService } from './abdm.service';

/**
 * ABDM M2/M3 endpoints for the hospital's own admin console.
 *
 * The ABDM gateway itself is addressed server-to-server from `AbdmService`;
 * these routes are therefore staff-guarded rather than public, and every call
 * they make lands in the audit trail.
 */
@ApiTags('ABDM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('abdm')
export class AbdmController {
  constructor(private readonly abdmService: AbdmService) {}

  @Get('bundles/:id')
  @ApiOperation({ summary: 'Fetch one stored FHIR bundle (staff only)' })
  async getBundle(@Param('id') id: string) {
    return this.abdmService.findBundle(id);
  }

  @Post('consents/:id/revoke')
  @ApiOperation({ summary: 'Revoke a consent artefact (staff only)' })
  async revokeConsent(@Param('id') id: string) {
    return this.abdmService.setConsentStatus(id, 'REVOKED');
  }
}
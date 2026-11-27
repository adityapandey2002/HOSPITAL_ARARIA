import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@dh-araria/shared';

import { EraktkoshService } from './eraktkosh.service';

@ApiTags('Blood Availability (e-RaktKosh)')
@Controller('blood')
export class EraktkoshController {
  constructor(private readonly service: EraktkoshService) {}

  @Get('araria')
  @Public()
  @ApiOperation({ summary: 'Current blood availability for Araria district' })
  @ApiResponse({ status: 200, description: 'Availability retrieved' })
  async getAraria(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === '1' || refresh === 'true';
    return this.service.getAvailability({ refresh: forceRefresh });
  }

  @Get('cron-sync')
  @Public()
  @ApiOperation({ summary: 'Scheduled Vercel Cron hook for e-RaktKosh sync' })
  async cronSync(
    @Headers('authorization') authHeader?: string,
    @Headers('x-cron-secret') cronSecretHeader?: string
  ) {
    const expectedSecret = process.env.CRON_SECRET?.trim();
    if (!expectedSecret) {
      throw new UnauthorizedException('CRON_SECRET is not configured');
    }
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const provided = cronSecretHeader?.trim() || bearerToken;
    if (!provided || provided !== expectedSecret) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return this.service.sync('schedule');
  }

  @Post('sync')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger an e-RaktKosh sync (admin only)' })
  async sync() {
    return this.service.sync('manual');
  }

  @Post('retention')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Prune history older than the retention window (admin only)' })
  async retention(@Body('days') days?: number) {
    return { removed: await this.service.retention(days) };
  }
}

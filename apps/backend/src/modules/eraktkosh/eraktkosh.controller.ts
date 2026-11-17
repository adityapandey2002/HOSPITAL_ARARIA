import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
  @Public()
  @ApiOperation({ summary: 'Current blood availability for Araria district' })
  @ApiResponse({ status: 200, description: 'Availability retrieved' })
  async getAraria() {
    return this.service.getAvailability();
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

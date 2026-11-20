import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dh-araria/shared';

import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PaginationDto } from '../../common/dto/pagination.dto';

import {
  BLOOD_GROUPS,
  BLOOD_COMPONENT_TYPES,
  BloodBankService,
} from './blood-bank.service';
import { AdjustBloodStockDto, SetBloodStockDto } from './dto/blood-stock.dto';
import { SubmitBloodRequestDto, UpdateBloodRequestStatusDto } from './dto/blood-request.dto';

@ApiTags('Blood Bank')
@Controller('blood-bank')
export class BloodBankController {
  constructor(private readonly bloodBankService: BloodBankService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get blood bank inventory' })
  @ApiResponse({ status: 200, description: 'Inventory retrieved successfully' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.bloodBankService.findAll(pagination);
  }

  @Get('summary')
  @Public()
  @ApiOperation({ summary: 'Get blood stock summary grouped by blood group' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getSummary() {
    return this.bloodBankService.getStockSummary();
  }

  @Get('blood-groups')
  @Public()
  @ApiOperation({ summary: 'Get supported blood groups' })
  async getBloodGroups() {
    return this.bloodBankService.getBloodGroups();
  }

  @Get('component-types')
  @Public()
  @ApiOperation({ summary: 'Get supported blood component types' })
  async getComponentTypes() {
    return this.bloodBankService.getComponentTypes();
  }

  @Post('stock')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust blood stock by a relative amount (Admin/Staff only)' })
  async updateStock(@Body() dto: AdjustBloodStockDto) {
    return this.bloodBankService.updateStock(dto.bloodGroup, dto.componentType, dto.units);
  }

  @Put('stock')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set blood stock to an absolute quantity (Admin/Staff only)' })
  async setStock(@Body() dto: SetBloodStockDto) {
    return this.bloodBankService.setStock(dto.bloodGroup, dto.componentType, dto.units);
  }

  @Post('requests')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a blood request from the public portal' })
  @ApiResponse({ status: 201, description: 'Blood request accepted' })
  async createRequest(@Body() dto: SubmitBloodRequestDto) {
    return this.bloodBankService.createRequest(dto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List blood requests (Admin/Staff)' })
  async listRequests(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.bloodBankService.listRequests(pagination, status ? { status: status as any } : {});
  }

  @Put('requests/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move a blood request through its queue (Admin/Staff)' })
  async updateRequestStatus(@Param('id') id: string, @Body() dto: UpdateBloodRequestStatusDto) {
    return this.bloodBankService.updateRequestStatus(id, dto.status, dto.notes);
  }
}

export { BLOOD_GROUPS, BLOOD_COMPONENT_TYPES };

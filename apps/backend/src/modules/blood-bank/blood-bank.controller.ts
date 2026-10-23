import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dh-araria/shared';

import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AdjustBloodStockDto, SetBloodStockDto } from './dto/blood-stock.dto';

import { BLOOD_COMPONENT_TYPES, BLOOD_GROUPS, BloodBankService } from './blood-bank.service';

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
}

export { BLOOD_GROUPS, BLOOD_COMPONENT_TYPES };

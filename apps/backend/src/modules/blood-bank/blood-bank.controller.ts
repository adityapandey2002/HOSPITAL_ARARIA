import { Controller, Get, Post, Put, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { BloodBankService } from './blood-bank.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, BloodGroup, BloodComponentType } from '@dh-araria/shared/types';

@ApiTags('Blood Bank')
@Controller('blood-bank')
export class BloodBankController {
  constructor(private bloodBankService: BloodBankService) {}

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
  @ApiOperation({ summary: 'Get available blood groups' })
  @ApiResponse({ status: 200, description: 'Blood groups retrieved successfully' })
  async getBloodGroups() {
    return this.bloodBankService.getBloodGroups();
  }

  @Get('component-types')
  @Public()
  @ApiOperation({ summary: 'Get available blood component types' })
  @ApiResponse({ status: 200, description: 'Component types retrieved successfully' })
  async getComponentTypes() {
    return this.bloodBankService.getComponentTypes();
  }

  @Post('stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update blood stock (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  async updateStock(@Body() data: { bloodGroup: BloodGroup; componentType: BloodComponentType; units: number }) {
    return this.bloodBankService.updateStock(data.bloodGroup, data.componentType, data.units);
  }

  @Put('stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set blood stock to specific quantity (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Stock set successfully' })
  async setStock(@Body() data: { bloodGroup: BloodGroup; componentType: BloodComponentType; units: number }) {
    return this.bloodBankService.setStock(data.bloodGroup, data.componentType, data.units);
  }
}
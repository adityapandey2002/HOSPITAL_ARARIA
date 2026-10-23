import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@dh-araria/shared';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all doctors with filters' })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string
  ) {
    // Query strings arrive as text; `eq(boolean, "false")` would match nothing.
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.doctorsService.findAll(pagination, {
      departmentId,
      isActive: active,
      search,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findById(@Param('id') id: string) {
    return this.doctorsService.findById(id);
  }

  @Get(':id/slots')
  @Public()
  @ApiOperation({ summary: 'Get available slots for a doctor on a specific date' })
  @ApiResponse({ status: 200, description: 'Slots retrieved successfully' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'ISO date string' })
  async getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.getAvailableSlots(id, new Date(date));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create doctor profile (Admin only)' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  async create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update doctor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Doctor updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete doctor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Doctor deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.doctorsService.delete(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AppointmentsService } from './appointments.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@dh-araria/shared/types';
import { AppointmentStatus } from '@dh-araria/shared/types';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get all appointments (Admin/Staff/Doctor)' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.appointmentsService.findAll(pagination, { patientId, doctorId, departmentId, status, dateFrom, dateTo });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getMyAppointments(
    @CurrentUser('id') patientId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.appointmentsService.getMyAppointments(patientId, pagination);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get doctor appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getDoctorAppointments(
    @Param('doctorId') doctorId: string,
    @Query() pagination: PaginationDto,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.getDoctorAppointments(doctorId, pagination, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  async findById(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Book new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  async create(@Body() data: any, @CurrentUser('id') patientId?: string) {
    // If not authenticated, patientId will be undefined - handle in service
    return this.appointmentsService.create(data, patientId || data.patientId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update appointment (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.appointmentsService.update(id, data);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  async cancel(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: string) {
    return this.appointmentsService.cancel(id, userId, userRole);
  }
}
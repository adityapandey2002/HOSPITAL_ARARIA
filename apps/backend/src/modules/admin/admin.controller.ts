import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@dh-araria/shared';

import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AdminService } from './admin.service';
import {
  AssignDepartmentAccessDto,
  CreateDoctorDto,
  DepartmentAccessResponseDto,
  UpdateDoctorDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // -------------------------------------------------------------------------
  // Doctors
  // -------------------------------------------------------------------------

  @Get('doctors')
  @ApiOperation({ summary: 'List all doctors (Admin)' })
  @ApiResponse({ status: 200, description: 'Doctors retrieved successfully' })
  @ApiOperation({ summary: 'List doctors, optionally filtered by department' })
  listDoctors(@Query('departmentId') departmentId?: string) {
    return this.adminService.listDoctors(departmentId);
  }

  @Post('doctors')
  @ApiOperation({ summary: 'Add a doctor to a department (Admin)' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  createDoctor(
    @Body() dto: CreateDoctorDto,
    @CurrentUser('id') createdBy: string
  ) {
    return this.adminService.createDoctor(dto, createdBy);
  }

  @Patch('doctors/:id')
  @ApiOperation({ summary: 'Update a doctor (Admin)' })
  @ApiResponse({ status: 200, description: 'Doctor updated successfully' })
  updateDoctor(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.adminService.updateDoctor(id, dto);
  }

  @Delete('doctors/:id')
  @ApiOperation({ summary: 'Remove a doctor from a department (Admin)' })
  @ApiResponse({ status: 200, description: 'Doctor removed successfully' })
  deleteDoctor(@Param('id') id: string) {
    return this.adminService.deleteDoctor(id);
  }

  // -------------------------------------------------------------------------
  // Department nodal officer access
  // -------------------------------------------------------------------------

  @Get('department-access')
  @ApiOperation({ summary: 'List department access grants (nodal officers)' })
  @ApiResponse({ status: 200, description: 'Access grants retrieved successfully' })
  listDepartmentAccess() {
    return this.adminService.listDepartmentAccess();
  }

  @Post('department-access')
  @ApiOperation({ summary: 'Nominate a staff user as nodal officer for a department' })
  @ApiResponse({ status: 201, description: 'Access grant created' })
  assignDepartmentAccess(
    @Body() dto: AssignDepartmentAccessDto,
    @CurrentUser('id') grantedBy: string
  ): Promise<DepartmentAccessResponseDto> {
    return this.adminService.assignDepartmentAccess(dto, grantedBy);
  }

  @Delete('department-access/:id')
  @ApiOperation({ summary: 'Revoke a department access grant' })
  @ApiResponse({ status: 200, description: 'Access grant revoked' })
  revokeDepartmentAccess(@Param('id') id: string) {
    return this.adminService.revokeDepartmentAccess(id);
  }
}

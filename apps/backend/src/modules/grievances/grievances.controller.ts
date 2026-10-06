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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { GrievancesService } from './grievances.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, GrievanceStatus, GrievanceCategory } from '@prisma/client';

@ApiTags('Grievances')
@Controller('grievances')
export class GrievancesController {
  constructor(private grievancesService: GrievancesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all grievances (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Grievances retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: GrievanceStatus })
  @ApiQuery({ name: 'category', required: false, enum: GrievanceCategory })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: GrievanceStatus,
    @Query('category') category?: GrievanceCategory,
    @Query('userId') userId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.grievancesService.findAll(pagination, { status, category, userId, assignedTo });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user grievances' })
  @ApiResponse({ status: 200, description: 'Grievances retrieved successfully' })
  async getMyGrievances(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.grievancesService.getMyGrievances(userId, pagination);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get grievance categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.grievancesService.getCategories();
  }

  @Get('statuses')
  @Public()
  @ApiOperation({ summary: 'Get grievance statuses' })
  @ApiResponse({ status: 200, description: 'Statuses retrieved successfully' })
  async getStatuses() {
    return this.grievancesService.getStatuses();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get grievance by ID' })
  @ApiResponse({ status: 200, description: 'Grievance retrieved successfully' })
  async findById(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: string) {
    const grievance = await this.grievancesService.findById(id);
    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && grievance.userId !== userId) {
      throw new ForbiddenException('Not authorized to view this grievance');
    }
    return grievance;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Submit new grievance' })
  @ApiResponse({ status: 201, description: 'Grievance submitted successfully' })
  async create(@Body() data: any, @CurrentUser('id') userId?: string) {
    return this.grievancesService.create(data, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update grievance' })
  @ApiResponse({ status: 200, description: 'Grievance updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.grievancesService.update(id, data, userId, userRole);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update grievance status (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: GrievanceStatus,
    @Body('resolution') resolution: string | undefined,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.grievancesService.updateStatus(id, status, userId, userRole, resolution);
  }

  @Put(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign grievance (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Grievance assigned successfully' })
  async assign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.grievancesService.assign(id, assigneeId, userId, userRole);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete grievance' })
  @ApiResponse({ status: 200, description: 'Grievance deleted successfully' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.grievancesService.delete(id, userId, userRole);
  }
}
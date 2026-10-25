import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { UserRole } from '@dh-araria/shared';

import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ComplaintsService } from './complaints.service';
import {
  CreateComplaintDto,
  ComplaintQueryDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

@ApiTags('Complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a complaint (public, optional contact details)' })
  @ApiResponse({ status: 201, description: 'Complaint accepted' })
  @ApiResponse({ status: 404, description: 'Department not found or inactive' })
  create(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all complaints (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Complaints retrieved successfully' })
  findAll(@Query() query: ComplaintQueryDto) {
    return this.complaintsService.findAll(
      { page: query.page ? Number(query.page) : 1, limit: query.limit ? Number(query.limit) : 10 },
      query
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complaint status aggregates for the admin panel' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.complaintsService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complaint by ID' })
  @ApiResponse({ status: 200, description: 'Complaint retrieved successfully' })
  async findById(@Param('id') id: string) {
    return this.complaintsService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update complaint status (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string
  ) {
    return this.complaintsService.updateStatus(id, dto.status, userId, userRole, dto.resolution);
  }
}

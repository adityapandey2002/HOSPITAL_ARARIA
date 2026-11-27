import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dh-araria/shared';

import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

import {
  CompleteQualityEventTaskDto,
  CreateQualityEventDto,
  CreateQualityEventTaskDto,
  UpdateQualityEventDto,
} from './dto/quality-event.dto';
import { QualityEventsService } from './quality-events.service';

@ApiTags('QualityEvents')
@Controller('quality-events')
export class QualityEventsController {
  constructor(private readonly service: QualityEventsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List quality events (all for Admin, active assigned for Department In-charges)' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string
  ) {
    return this.service.findAll(userId, userRole);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quality event details and deadline state' })
  async findById(@Param('id') id: string, @CurrentUser('role') userRole: string) {
    return this.service.findById(id, userRole);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a hospital-wide quality event with deadline and per-department checklists (Admin/HM)' })
  @ApiResponse({ status: 201, description: 'Quality event launched with department tasks' })
  async create(
    @Body() body: CreateQualityEventDto,
    @CurrentUser('id') userId: string
  ) {
    return this.service.create({ ...body, userId });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event title, deadline, active state, or archive status (Admin/HM)' })
  async update(@Param('id') id: string, @Body() body: UpdateQualityEventDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a quality event (Admin/HM)' })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get(':id/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List checklist items for an event (department-scoped for Staff in-charges)' })
  async getTasks(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query('departmentId') departmentId?: string
  ) {
    return this.service.getTasks(id, userId, userRole, departmentId);
  }

  @Post(':id/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a checklist item to one department or all departments in an event (Admin/HM)' })
  async addTasks(
    @Param('id') id: string,
    @Body() body: CreateQualityEventTaskDto
  ) {
    return this.service.addTasks(id, body);
  }

  @Delete(':id/tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a checklist item from an event (Admin/HM)' })
  async deleteTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.service.deleteTask(id, taskId);
  }

  @Patch(':id/tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle checklist completion and optional support remarks (Admin or assigned Department In-charge)' })
  async completeTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: CompleteQualityEventTaskDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string
  ) {
    return this.service.completeTask(
      id,
      taskId,
      userId,
      userRole,
      body.isCompleted,
      body.remarks
    );
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hospital-wide and department-wise readiness analytics & support-needed breakdown (Admin/HM)' })
  async getProgress(@Param('id') id: string) {
    return this.service.getProgress(id);
  }
}

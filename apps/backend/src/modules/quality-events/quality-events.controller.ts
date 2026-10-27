import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { QualityEventsService } from './quality-events.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@dh-araria/shared';

@ApiTags('QualityEvents')
@Controller('quality-events')
export class QualityEventsController {
  constructor(private service: QualityEventsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async create(
    @Body() body: { type: string; title: string; description?: string; startDate?: string; endDate?: string; departmentIds?: string[] },
    @CurrentUser('id') userId: string
  ) {
    return this.service.create({ ...body, userId });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get(':id/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  async getTasks(@Param('id') id: string, @Query('departmentId') departmentId?: string) {
    return this.service.getTasks(id, departmentId);
  }

  @Patch(':id/tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  async completeTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: { isCompleted: boolean },
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string
  ) {
    return this.service.completeTask(id, taskId, userId, userRole, body.isCompleted);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async getProgress(@Param('id') id: string) {
    return this.service.getProgress(id);
  }
}

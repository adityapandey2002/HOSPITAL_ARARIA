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

import { NoticesService } from './notices.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@dh-araria/shared/types';
import { NoticeCategory, NoticePriority } from '@dh-araria/shared/types';

@ApiTags('Notices')
@Controller('notices')
export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notices (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Notices retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: NoticeCategory })
  @ApiQuery({ name: 'priority', required: false, enum: NoticePriority })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('category') category?: NoticeCategory,
    @Query('priority') priority?: NoticePriority,
    @Query('isPublished') isPublished?: boolean,
    @Query('language') language?: string,
    @Query('search') search?: string,
  ) {
    return this.noticesService.findAll(pagination, { category, priority, isPublished, language, search });
  }

  @Get('published')
  @Public()
  @ApiOperation({ summary: 'Get published notices for public view' })
  @ApiResponse({ status: 200, description: 'Notices retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'language', required: false, type: String })
  async findPublished(
    @Query() pagination: PaginationDto,
    @Query('language') language?: string,
  ) {
    return this.noticesService.findPublished(pagination, language);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get notice categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.noticesService.getCategories();
  }

  @Get('priorities')
  @Public()
  @ApiOperation({ summary: 'Get notice priorities' })
  @ApiResponse({ status: 200, description: 'Priorities retrieved successfully' })
  async getPriorities() {
    return this.noticesService.getPriorities();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get notice by ID' })
  @ApiResponse({ status: 200, description: 'Notice retrieved successfully' })
  async findById(@Param('id') id: string) {
    return this.noticesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create notice (Admin/Staff)' })
  @ApiResponse({ status: 201, description: 'Notice created successfully' })
  async create(@Body() data: any, @CurrentUser('id') userId: string) {
    return this.noticesService.create(data, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notice (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Notice updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.noticesService.update(id, data, userId, userRole);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete notice (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Notice deleted successfully' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: string) {
    return this.noticesService.delete(id, userId, userRole);
  }
}
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SlideshowService } from './slideshow.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@dh-araria/shared';

@ApiTags('Slideshow')
@Controller('slideshow')
export class SlideshowController {
  constructor(private slideshowService: SlideshowService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get active slideshow images (public)' })
  @ApiResponse({ status: 200, description: 'Slideshow images retrieved' })
  async findActive() {
    return this.slideshowService.findActive();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all slideshow images (admin)' })
  @ApiResponse({ status: 200, description: 'Slideshow images retrieved' })
  async findAll() {
    return this.slideshowService.findAll();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add slideshow image (admin)' })
  @ApiResponse({ status: 201, description: 'Slideshow image created' })
  async create(@Body() body: { url: string; alt?: string; caption?: string; sortOrder?: number }) {
    return this.slideshowService.create(body);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update slideshow image (admin)' })
  @ApiResponse({ status: 200, description: 'Slideshow image updated' })
  async update(@Param('id') id: string, @Body() body: Partial<{ url: string; alt: string; caption: string; sortOrder: number; isActive: boolean }>) {
    return this.slideshowService.update(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete slideshow image (admin)' })
  @ApiResponse({ status: 200, description: 'Slideshow image deleted' })
  async delete(@Param('id') id: string) {
    return this.slideshowService.delete(id);
  }
}

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
import { Throttle } from '@nestjs/throttler';

import { UserRole } from '@dh-araria/shared';

import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { FeedbackService, type FeedbackActor } from './feedback.service';
import {
  CreateFeedbackAccessDto,
  CreateFeedbackDto,
  FeedbackQueryDto,
  FeedbackStatsQueryDto,
  UpdateFeedbackStatusDto,
} from './dto/feedback.dto';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Public()
  // Public write endpoint: the global 100/min budget is far too generous for a
  // form a bot can use to fill the HM inbox.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit department feedback (public, anonymous)' })
  @ApiResponse({ status: 201, description: 'Feedback accepted' })
  @ApiResponse({ status: 404, description: 'Department not found or inactive' })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  // Static paths come before any `:id` route so Nest/Express never parses
  // "scope", "stats" or "access" as a feedback identifier.
  @Get('scope')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Departments the signed-in user may read' })
  getScope(@CurrentUser() user: FeedbackActor) {
    return this.feedbackService.getScope(user);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feedback aggregates for the departments in scope' })
  getStats(@Query() query: FeedbackStatsQueryDto, @CurrentUser() user: FeedbackActor) {
    return this.feedbackService.getStats(query, user);
  }

  @Get('access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List department access grants (Admin only)' })
  listAccess(@CurrentUser() user: FeedbackActor) {
    return this.feedbackService.listAccess(user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List feedback in scope, newest first' })
  findAll(@Query() query: FeedbackQueryDto, @CurrentUser() user: FeedbackActor) {
    return this.feedbackService.findAll(query, user);
  }

  @Post('access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grant a user read access to departments (Admin only)' })
  @ApiResponse({ status: 201, description: 'Current grants for the user/department pair' })
  createAccess(@Body() dto: CreateFeedbackAccessDto, @CurrentUser() user: FeedbackActor) {
    return this.feedbackService.createAccess(dto, user);
  }

  @Delete('access/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a department access grant (Admin only)' })
  deleteAccess(@Param('id') id: string, @CurrentUser() user: FeedbackActor) {
    return this.feedbackService.deleteAccess(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move feedback through its workflow (Admin or granted department)' })
  @ApiResponse({ status: 403, description: 'No access to the feedback department' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
    @CurrentUser() user: FeedbackActor
  ) {
    return this.feedbackService.updateStatus(id, dto.status, user);
  }
}

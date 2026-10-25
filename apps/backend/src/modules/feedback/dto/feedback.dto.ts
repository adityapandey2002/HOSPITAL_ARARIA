import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEmpty,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { FeedbackServiceArea, FeedbackStatus } from '@dh-araria/shared';

import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Public feedback submission.
 *
 * `status` and the timestamps are deliberately absent: they are server-owned.
 * The service also builds the insert row field-by-field, so a caller cannot
 * smuggle a workflow state through the public endpoint even if this DTO grows.
 */
export class CreateFeedbackDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  departmentId!: string;

  /** One or more departments visited (simple form may select several). */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({ enum: FeedbackServiceArea, default: 'OPD' })
  @IsOptional()
  @IsEnum(FeedbackServiceArea)
  serviceArea?: FeedbackServiceArea;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cleanliness?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  staffBehaviour?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  waitTime?: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  /** What the citizen liked most about their visit (simple form). */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  likedMost?: string;

  /** What the citizen wants to suggest (simple form). */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  suggestion?: string;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Optional — feedback is anonymous by default',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  /**
   * Permissive on purpose: Indian numbers arrive with `+91`, spaces, dashes and
   * brackets. Same pattern as the public contact form.
   */
  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-()\s]{7,20}$/, { message: 'phone must look like a phone number' })
  phone?: string;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  /**
   * Honeypot: rendered hidden and left empty by humans. Any value fails
   * validation, so bots that fill every field never reach the service.
   */
  @ApiHideProperty()
  @IsOptional()
  @IsEmpty()
  website?: string;
}

/** Inbox filters plus pagination. Sort keys are allow-listed in the service. */
export class FeedbackQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ enum: FeedbackStatus })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiPropertyOptional({ enum: FeedbackServiceArea })
  @IsOptional()
  @IsEnum(FeedbackServiceArea)
  serviceArea?: FeedbackServiceArea;

  @ApiPropertyOptional({ format: 'date-time', description: 'Inclusive lower bound (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time', description: 'Inclusive upper bound (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class FeedbackStatsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class UpdateFeedbackStatusDto {
  @ApiProperty({ enum: FeedbackStatus })
  @IsEnum(FeedbackStatus)
  status!: FeedbackStatus;
}

export class CreateFeedbackAccessDto {
  @ApiProperty({ format: 'uuid', description: 'User receiving the grant' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ type: [String], format: 'uuid', description: 'One or more departments' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  departmentIds!: string[];
}

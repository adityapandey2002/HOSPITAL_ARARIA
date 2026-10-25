import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ComplaintStatus } from '@dh-araria/shared';

/**
 * Public complaint submission.
 *
 * Deliberately simpler than the grievance form: only name, department and the
 * complaint itself are required. Email/phone are optional so a citizen can
 * complain anonymously. An image URL (from the camera option) may be attached.
 */
export class CreateComplaintDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ format: 'uuid', description: 'Department the complaint is about' })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ minLength: 5, maxLength: 5000 })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  complaint!: string;

  @ApiPropertyOptional({
    maxLength: 2000,
    description: 'Optional photo taken with the camera option',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
}

/** Admin-facing status update for a complaint. */
export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;
}

/** Complaint list filters plus pagination. */
export class ComplaintQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)' })
  @IsOptional()
  @Matches(/^\d+$/, { message: 'page must be a positive integer' })
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @Matches(/^\d+$/, { message: 'limit must be a positive integer' })
  limit?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQualityEventDto {
  @ApiProperty({ example: 'NQAS' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  type!: string;

  @ApiProperty({ example: 'NQAS Certification Drive — Q4 2026' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'ISO date string for event start' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date string for target completion deadline' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Department IDs to include (defaults to all active departments)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional custom hospital-wide checklist pointers applied to every selected department',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  commonTasks?: string[];

  @ApiPropertyOptional({
    description: 'Optional map of departmentId -> custom checklist pointers for that department',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  departmentTasks?: Record<string, string[]>;
}

export class UpdateQualityEventDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: 160 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: 'ISO date string or empty string to clear deadline' })
  @IsOptional()
  @IsString()
  endDate?: string | null;
}

export class CreateQualityEventTaskDto {
  @ApiProperty({ description: 'Target department ID, or "ALL" to add across all participating departments' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  departmentId!: string;

  @ApiProperty({ minLength: 3, maxLength: 300 })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CompleteQualityEventTaskDto {
  @ApiProperty()
  @IsBoolean()
  isCompleted!: boolean;

  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Optional in-charge note or support request for HM',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

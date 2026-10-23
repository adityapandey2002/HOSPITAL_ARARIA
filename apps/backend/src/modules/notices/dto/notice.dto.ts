import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

import { NoticeCategory, NoticePriority } from '@dh-araria/shared';

export class CreateNoticeDto {
  @ApiProperty({ minLength: 5, maxLength: 200 })
  @IsString()
  @Length(5, 200)
  title!: string;

  @ApiProperty({ minLength: 20 })
  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  content!: string;

  @ApiPropertyOptional({ enum: NoticeCategory, default: NoticeCategory.GENERAL })
  @IsOptional()
  @IsEnum(NoticeCategory)
  category?: NoticeCategory;

  @ApiPropertyOptional({ enum: NoticePriority, default: NoticePriority.MEDIUM })
  @IsOptional()
  @IsEnum(NoticePriority)
  priority?: NoticePriority;

  @ApiPropertyOptional({ description: 'Defaults to now when publishing' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  attachmentUrl?: string;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  language?: string;
}

export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}

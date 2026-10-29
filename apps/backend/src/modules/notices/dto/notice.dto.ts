import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
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

  /**
   * Scanned pages attached while drafting, as base64 data URLs.
   *
   * Three is the practical ceiling: each image is compressed to stay under
   * 900,000 characters, and the route body limit is 4 MB.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Attached scans as base64 data URLs (maximum 3)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(1_000_000, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  language?: string;
}

export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}

export class ExtractNoticeTextDto {
  @ApiProperty({
    description: 'The page to read, as a base64 data URL or an https link',
  })
  @IsString()
  @MaxLength(3_000_000)
  image!: string;

  @ApiPropertyOptional({ enum: ['auto', 'en', 'hi'], default: 'auto' })
  @IsOptional()
  @IsIn(['auto', 'en', 'hi'])
  language?: 'auto' | 'en' | 'hi';
}

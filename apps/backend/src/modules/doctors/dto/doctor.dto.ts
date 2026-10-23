import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDoctorDto {
  /** Existing `users` row that will own this profile. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 120)
  specialization!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 200)
  qualification!: string;

  @ApiProperty({ description: 'Completed years of practice', minimum: 0, maximum: 70 })
  @IsInt()
  @Min(0)
  @Max(70)
  experience!: number;

  @ApiPropertyOptional({ description: 'ABDM Healthcare Professional Registry ID' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  hprId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;
}

/**
 * `userId` is immutable: moving a profile to another account would orphan the
 * doctor's appointments. `isActive` is only settable on update.
 */
export class UpdateDoctorDto extends PartialType(OmitType(CreateDoctorDto, ['userId'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

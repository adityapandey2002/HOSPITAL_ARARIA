import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { BloodGroup, BloodComponentType, BloodRequestStatus } from '@dh-araria/shared';

import { BLOOD_GROUPS, BLOOD_COMPONENT_TYPES } from '../blood-bank.service';

/** Indian mobile phone shape, mirroring the register DTO. */
const PHONE_PATTERN = /^(\+91|0)?[6-9]\d{9}$/;

export class SubmitBloodRequestDto {
  @ApiProperty({ minLength: 2, maxLength: 120, example: 'Rajegaon Vaidya' })
  @IsString()
  @Length(2, 120)
  patientName!: string;

  @ApiProperty({ minLength: 2, maxLength: 120, example: 'Dr. Option biomedical Pvt Ltd' })
  @IsString()
  @Length(2, 120)
  requesterName!: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Please provide a valid Indian phone number' })
  phone!: string;

  @ApiPropertyOptional({ example: 'teamlead@hospital.in' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: BLOOD_GROUPS })
  @IsEnum(BloodGroup)
  bloodGroup!: BloodGroup;

  @ApiProperty({ enum: BLOOD_COMPONENT_TYPES })
  @IsEnum(BloodComponentType)
  componentType!: BloodComponentType;

  @ApiProperty({ minimum: 1, maximum: 10, example: 2 })
  @IsInt()
  @Min(1)
  @Max(10)
  units!: number;

  @ApiProperty({ description: 'ISO date, e.g. 2026-11-20', example: '2026-11-21T00:00:00' })
  @IsDateString()
  neededBy!: string;

  @ApiPropertyOptional({ example: 'Ward B, ICCU' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  hospital?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

export class UpdateBloodRequestStatusDto {
  @ApiProperty({ enum: BloodRequestStatus })
  @IsEnum(BloodRequestStatus)
  status!: BloodRequestStatus;

  @ApiPropertyOptional({ example: 'Sent with the waiver approval form.' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

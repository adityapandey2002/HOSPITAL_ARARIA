import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { AppointmentType } from '@dh-araria/shared';

/** `HH:mm`, 24-hour. The database stores time slots in this exact form. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAppointmentDto {
  /**
   * Only used when the request has no authenticated session. The controller
   * prefers the JWT subject, so a logged-in user cannot book for someone else.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Required for guest booking' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  doctorId!: string;

  /**
   * Accepted but ignored: the department is derived from the doctor row inside
   * the booking transaction. Kept in the DTO because the booking form posts it
   * and `forbidNonWhitelisted` would otherwise reject the request.
   */
  @ApiPropertyOptional({ format: 'uuid', deprecated: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ example: '2026-11-04' })
  @IsDateString()
  appointmentDate!: string;

  @ApiProperty({ example: '09:30' })
  @Matches(TIME_PATTERN, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiPropertyOptional({ example: '09:50' })
  @IsOptional()
  @Matches(TIME_PATTERN, { message: 'endTime must be HH:mm' })
  endTime?: string;

  @ApiPropertyOptional({ enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  abhaId?: string;
}

/**
 * Rescheduling and note edits only. Reassigning the patient, doctor or
 * department would break the invariant that the department comes from the
 * doctor, so those fields are immutable after booking.
 */
export class UpdateAppointmentDto extends PartialType(
  OmitType(CreateAppointmentDto, ['patientId', 'doctorId', 'departmentId'] as const)
) {}

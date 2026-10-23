import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { AppointmentStatus } from '@dh-araria/shared';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}

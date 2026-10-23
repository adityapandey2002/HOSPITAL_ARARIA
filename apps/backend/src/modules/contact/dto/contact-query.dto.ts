import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { ContactMessageStatus } from '@dh-araria/shared';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ContactQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ContactMessageStatus })
  @IsOptional()
  @IsEnum(ContactMessageStatus)
  status?: ContactMessageStatus;
}

export class UpdateContactStatusDto {
  @ApiProperty({ enum: ContactMessageStatus })
  @IsEnum(ContactMessageStatus)
  status!: ContactMessageStatus;
}

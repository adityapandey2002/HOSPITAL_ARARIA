import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

import { UserRole } from '@dh-araria/shared';

const PHONE_PATTERN = /^[0-9+\-()\s]{7,20}$/;

export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'phone must look like a phone number' })
  phone?: string;
}

export class AdminUpdateUserDto extends UpdateProfileDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

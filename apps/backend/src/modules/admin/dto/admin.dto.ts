import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from '@dh-araria/shared';

export class CreateDoctorDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @Matches(/^[0-9+\-()\s]{7,20}$/, { message: 'phone must look like a phone number' })
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  specialization!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  qualification!: string;

  @ApiProperty({ minimum: 0 })
  @IsString()
  @Matches(/^\d+$/, { message: 'experience must be a number' })
  experience!: string;

  @ApiProperty({ format: 'uuid', description: 'Department ID' })
  @IsUUID()
  departmentId!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: '["English", "Hindi"]' })
  @IsOptional()
  @IsString()
  languages?: string;

  @ApiPropertyOptional({ example: 'HID123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  hprId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 9999 })
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'consultationFee must be a number' })
  consultationFee?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.DOCTOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}

export class AssignDepartmentAccessDto {
  @ApiProperty({ format: 'uuid', description: 'User ID (staff member to nominate as nodal officer)' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ format: 'uuid', description: 'Department ID' })
  @IsUUID()
  departmentId!: string;
}

export class DepartmentAccessResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  departmentId!: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  userEmail?: string;

  @ApiPropertyOptional()
  departmentName?: string;

  @ApiPropertyOptional()
  grantedBy?: string | null;

  @ApiProperty()
  createdAt: Date;
}

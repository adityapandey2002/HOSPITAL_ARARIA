import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
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

/** Same strength rules as the public registration form. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Admin-provisioned department staff account.
 *
 * The account is always STAFF; department grants are part of the same request
 * so an admin never creates a usable login that sees nothing. ADMIN accounts
 * remain visible to every department and are not created from this screen.
 */
export class CreateStaffDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-()\s]{7,20}$/, { message: 'phone must look like a phone number' })
  phone?: string;

  @ApiProperty({ minLength: 8, maxLength: 50, description: 'Initial password' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(PASSWORD_PATTERN, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Departments whose complaints this person can see and update',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  departmentIds!: string[];
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional({ description: 'Deactivating keeps the history trail intact' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StaffDepartmentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class StaffMemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [StaffDepartmentDto] })
  departments!: StaffDepartmentDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

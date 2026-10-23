import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { GrievanceCategory, GrievanceStatus } from '@dh-araria/shared';

export class CreateGrievanceDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @Matches(/^[0-9+\-()\s]{7,20}$/, { message: 'phone must look like a phone number' })
  phone!: string;

  @ApiProperty({ enum: GrievanceCategory })
  @IsEnum(GrievanceCategory)
  category!: GrievanceCategory;

  @ApiProperty({ minLength: 5, maxLength: 200 })
  @IsString()
  @Length(5, 200)
  subject!: string;

  @ApiProperty({ minLength: 20, maxLength: 5000 })
  @IsString()
  @Length(20, 5000)
  description!: string;
}

/**
 * Citizen-editable fields only. Status, assignment, CPGRAMS id and the owning
 * user are deliberately absent — otherwise a complainant could mark their own
 * grievance RESOLVED through `PUT /grievances/:id`.
 */
export class UpdateGrievanceDto extends PartialType(CreateGrievanceDto) {}

export class UpdateGrievanceStatusDto {
  @ApiProperty({ enum: GrievanceStatus })
  @IsEnum(GrievanceStatus)
  status!: GrievanceStatus;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;
}

export class AssignGrievanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assigneeId!: string;
}

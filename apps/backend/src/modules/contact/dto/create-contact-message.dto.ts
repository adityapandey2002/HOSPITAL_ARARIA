import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

import { CONTACT_SUBJECTS } from '@dh-araria/shared';

/** Public contact-form submission. Matches the fields rendered by ContactPage. */
export class CreateContactMessageDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @Length(5, 254)
  email!: string;

  /**
   * Optional because the form allows it to be left blank. The pattern is
   * deliberately permissive: Indian numbers arrive with `+91`, spaces, dashes
   * and brackets, and over-strict validation rejects legitimate submissions.
   */
  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-()\s]{7,20}$/, { message: 'phone must look like a phone number' })
  phone?: string;

  @ApiProperty({ enum: CONTACT_SUBJECTS })
  @IsIn(CONTACT_SUBJECTS)
  subject!: (typeof CONTACT_SUBJECTS)[number];

  @ApiProperty({ minLength: 20, maxLength: 5000 })
  @IsString()
  @Length(20, 5000)
  message!: string;
}

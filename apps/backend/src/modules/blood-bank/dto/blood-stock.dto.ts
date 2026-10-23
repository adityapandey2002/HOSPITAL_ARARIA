import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';

import { BloodComponentType, BloodGroup } from '@dh-araria/shared';

class BloodStockChangeDto {
  @ApiProperty({ enum: BloodGroup })
  @IsEnum(BloodGroup)
  bloodGroup!: BloodGroup;

  @ApiProperty({ enum: BloodComponentType })
  @IsEnum(BloodComponentType)
  componentType!: BloodComponentType;
}

/** `PUT /blood-bank/stock` — absolute units on hand. */
export class SetBloodStockDto extends BloodStockChangeDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  units!: number;
}

/** `POST /blood-bank/stock` — relative change; negative units issue blood. */
export class AdjustBloodStockDto extends BloodStockChangeDto {
  @ApiProperty({ description: 'Signed delta', example: -2 })
  @IsInt()
  units!: number;
}

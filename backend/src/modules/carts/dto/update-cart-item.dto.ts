import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity!: number;
}

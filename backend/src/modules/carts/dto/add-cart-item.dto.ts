import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
    format: 'uuid',
  })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity!: number;
}

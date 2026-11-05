import { Transform } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID('4')
  productId!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity!: number;
}

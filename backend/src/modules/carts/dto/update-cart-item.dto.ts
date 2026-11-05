import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity!: number;
}

import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const MONEY_PATTERN = /^(?!0(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Fone Bluetooth Pulse Pro' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({
    example: 'Fone sem fio com cancelamento de ruido e estojo de recarga.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description?: string | null;

  @ApiPropertyOptional({
    example: '329.90',
    description: 'Decimal positivo com até duas casas.',
  })
  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN, {
    message: 'price must be a positive decimal with up to two decimal places',
  })
  price?: string;

  @ApiPropertyOptional({ example: 42, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

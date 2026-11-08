import { IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    example: '22222222-2222-4222-8222-222222222222',
    format: 'uuid',
  })
  @IsUUID('4')
  cartId!: string;

  @ApiProperty({ example: 'cliente@example.com', format: 'email' })
  @IsEmail()
  customerEmail!: string;
}

import { IsEmail, IsUUID } from 'class-validator';

export class CheckoutDto {
  @IsUUID('4')
  cartId!: string;

  @IsEmail()
  customerEmail!: string;
}

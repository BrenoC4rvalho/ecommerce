import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto, @Req() request: Request) {
    return this.ordersService.checkout(request.cookies?.cart_session_id, dto);
  }
}

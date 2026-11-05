import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';
import { ApiConflictResponse, ApiCookieAuth, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

@Controller('orders')
@ApiTags('orders')
@ApiCookieAuth('cart_session_id')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiConflictResponse({ description: 'Estoque, versão ou estado do carrinho em conflito' })
  @ApiUnprocessableEntityResponse({ description: 'Carrinho vazio ou produto inativo' })
  checkout(@Body() dto: CheckoutDto, @Req() request: Request) {
    return this.ordersService.checkout(request.cookies?.cart_session_id, dto);
  }
}

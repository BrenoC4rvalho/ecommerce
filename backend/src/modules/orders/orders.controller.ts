import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  errorSchema,
  orderSchema,
  validationErrorSchema,
} from '../../common/swagger/api-examples';

@Controller('orders')
@ApiTags('orders')
@ApiCookieAuth('cart_session_id')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Finaliza o carrinho da sessão e cria um pedido confirmado',
  })
  @ApiCreatedResponse({
    description: 'Pedido confirmado.',
    schema: orderSchema,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos.',
    schema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: 'Carrinho ou produto inexistente.',
    schema: errorSchema(404, 'Not Found', 'Cart not found'),
  })
  @ApiConflictResponse({
    description: 'Estoque, versão ou estado do carrinho em conflito',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Carrinho vazio ou produto inativo',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  checkout(@Body() dto: CheckoutDto, @Req() request: Request) {
    return this.ordersService.checkout(request.cookies?.cart_session_id, dto);
  }
}

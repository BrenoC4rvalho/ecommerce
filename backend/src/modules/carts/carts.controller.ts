import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartsService } from './carts.service';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  cartSchema,
  createdCartSchema,
  errorSchema,
  validationErrorSchema,
} from '../../common/swagger/api-examples';

const SESSION_COOKIE = 'cart_session_id';

@Controller('carts')
@ApiTags('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria ou recupera o carrinho anônimo da sessão' })
  @ApiCreatedResponse({
    description:
      'Carrinho criado. A resposta define o cookie HttpOnly cart_session_id; ele não pertence ao corpo.',
    schema: createdCartSchema,
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  async create(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cart = await this.cartsService.create(
      request.cookies?.[SESSION_COOKIE],
    );
    response.cookie(SESSION_COOKIE, cart.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return {
      id: cart.id,
      status: cart.status,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  @Get(':id')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Obtém o carrinho da sessão atual' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiOkResponse({ description: 'Carrinho encontrado.', schema: cartSchema })
  @ApiNotFoundResponse({
    description: 'Carrinho inexistente ou não pertence à sessão',
  })
  @ApiBadRequestResponse({
    description: 'Identificador inválido.',
    schema: validationErrorSchema,
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: Request,
  ) {
    return this.cartsService.findOne(id, request.cookies?.[SESSION_COOKIE]);
  }

  @Post(':id/items')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Adiciona um produto ao carrinho da sessão' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiOkResponse({ description: 'Carrinho atualizado.', schema: cartSchema })
  @ApiBadRequestResponse({
    description: 'Dados ou identificador inválidos.',
    schema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: 'Carrinho ou produto inexistente.',
    schema: errorSchema(404, 'Not Found', 'Cart not found'),
  })
  @ApiConflictResponse({
    description:
      'Carrinho já finalizado ou quantidade acima do estoque disponível',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  addItem(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddCartItemDto,
    @Req() request: Request,
  ) {
    return this.cartsService.addItem(
      id,
      request.cookies?.[SESSION_COOKIE],
      dto,
    );
  }

  @Patch(':id/items/:itemId')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Atualiza a quantidade de um item do carrinho' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiParam({
    name: 'itemId',
    format: 'uuid',
    example: '33333333-3333-4333-8333-333333333333',
  })
  @ApiOkResponse({ description: 'Carrinho atualizado.', schema: cartSchema })
  @ApiBadRequestResponse({
    description: 'Dados ou identificador inválidos.',
    schema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: 'Carrinho, item ou produto inexistente.',
    schema: errorSchema(404, 'Not Found', 'Cart item not found'),
  })
  @ApiConflictResponse({
    description:
      'Carrinho já finalizado ou quantidade acima do estoque disponível',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  updateItem(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() request: Request,
  ) {
    return this.cartsService.updateItem(
      id,
      itemId,
      request.cookies?.[SESSION_COOKIE],
      dto,
    );
  }

  @Delete(':id/items/:itemId')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Remove um item do carrinho' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiParam({
    name: 'itemId',
    format: 'uuid',
    example: '33333333-3333-4333-8333-333333333333',
  })
  @ApiOkResponse({ description: 'Item removido com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Identificador inválido.',
    schema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: 'Carrinho ou item inexistente.',
    schema: errorSchema(404, 'Not Found', 'Cart item not found'),
  })
  @ApiConflictResponse({ description: 'Carrinho já finalizado' })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  async removeItem(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Req() request: Request,
  ) {
    await this.cartsService.removeItem(
      id,
      itemId,
      request.cookies?.[SESSION_COOKIE],
    );
  }
}

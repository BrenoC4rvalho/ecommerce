import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartsService } from './carts.service';
import { ApiConflictResponse, ApiCookieAuth, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';

const SESSION_COOKIE = 'cart_session_id';

@Controller('carts')
@ApiTags('carts')
@ApiCookieAuth('cart_session_id')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  async create(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const cart = await this.cartsService.create(request.cookies?.[SESSION_COOKIE]);
    response.cookie(SESSION_COOKIE, cart.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return { id: cart.id, status: cart.status, createdAt: cart.createdAt, updatedAt: cart.updatedAt };
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: 'Carrinho inexistente ou não pertence à sessão' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: Request) {
    return this.cartsService.findOne(id, request.cookies?.[SESSION_COOKIE]);
  }

  @Post(':id/items')
  @ApiConflictResponse({ description: 'Carrinho já finalizado' })
  addItem(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddCartItemDto,
    @Req() request: Request,
  ) {
    return this.cartsService.addItem(id, request.cookies?.[SESSION_COOKIE], dto);
  }

  @Patch(':id/items/:itemId')
  @ApiConflictResponse({ description: 'Carrinho já finalizado' })
  updateItem(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() request: Request,
  ) {
    return this.cartsService.updateItem(id, itemId, request.cookies?.[SESSION_COOKIE], dto);
  }

  @Delete(':id/items/:itemId')
  @ApiConflictResponse({ description: 'Carrinho já finalizado' })
  async removeItem(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Req() request: Request,
  ) {
    await this.cartsService.removeItem(id, itemId, request.cookies?.[SESSION_COOKIE]);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  emptyProductsListExample,
  errorSchema,
  productSchema,
  productsListExample,
  productsListSchema,
  validationErrorSchema,
} from '../../common/swagger/api-examples';

@Controller('products')
@ApiTags('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista produtos disponíveis no catálogo' })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'fone',
    description: 'Pesquisa parcial por nome ou descrição.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, minimum: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 12,
    minimum: 1,
    maximum: 100,
  })
  @ApiOkResponse({
    description: 'Produtos ativos com estoque positivo.',
    content: {
      'application/json': {
        schema: productsListSchema,
        examples: {
          pesquisaPorNome: {
            summary: 'Pesquisa por nome',
            value: productsListExample,
          },
          pesquisaSemResultados: {
            summary: 'Pesquisa sem resultados',
            value: emptyProductsListExample,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos.',
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
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto pelo identificador interno' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiOkResponse({ description: 'Produto encontrado.', schema: productSchema })
  @ApiNotFoundResponse({ description: 'Produto inexistente' })
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
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um produto' })
  @ApiCreatedResponse({ description: 'Produto criado.', schema: productSchema })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um produto' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiOkResponse({ description: 'Produto atualizado.', schema: productSchema })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiNotFoundResponse({ description: 'Produto inexistente' })
  @ApiInternalServerErrorResponse({
    description: 'Erro inesperado.',
    schema: errorSchema(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
    ),
  })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }
}

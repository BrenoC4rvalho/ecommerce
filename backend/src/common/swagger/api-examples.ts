export const productExample = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fone Bluetooth Pulse Pro',
  description: 'Fone sem fio com cancelamento de ruido e estojo de recarga.',
  price: '349.90',
  stock: 38,
  stockVersion: 0,
  isActive: true,
  createdAt: '2026-11-08T03:00:00.000Z',
  updatedAt: '2026-11-08T03:00:00.000Z',
};

export const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    price: { type: 'string', example: '349.90' },
    stock: { type: 'integer' },
    stockVersion: { type: 'integer' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  example: productExample,
};

export const productsListSchema = {
  type: 'object',
  properties: {
    data: { type: 'array', items: productSchema },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
};

export const productsListExample = {
  data: [productExample],
  meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
};

export const emptyProductsListExample = {
  data: [],
  meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
};

export const cartExample = {
  id: '22222222-2222-4222-8222-222222222222',
  status: 'ACTIVE',
  items: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      productId: productExample.id,
      productName: productExample.name,
      quantity: 2,
      unitPrice: '349.90',
      subtotal: '699.80',
    },
  ],
  estimatedTotal: '699.80',
  createdAt: '2026-11-08T03:00:00.000Z',
  updatedAt: '2026-11-08T03:05:00.000Z',
};

export const cartSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: { type: 'string', example: 'ACTIVE' },
    items: { type: 'array', items: { type: 'object' } },
    estimatedTotal: { type: 'string', example: '699.80' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  example: cartExample,
};

export const createdCartSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: { type: 'string', example: 'ACTIVE' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  example: {
    id: cartExample.id,
    status: cartExample.status,
    createdAt: cartExample.createdAt,
    updatedAt: cartExample.updatedAt,
  },
};

export const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    orderNumber: { type: 'string', example: 'PED-2026-000123' },
    cartId: { type: 'string', format: 'uuid' },
    customerEmail: { type: 'string', format: 'email' },
    status: { type: 'string', example: 'CONFIRMED' },
    totalAmount: { type: 'string', example: '699.80' },
    items: { type: 'array', items: { type: 'object' } },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  example: {
    id: '44444444-4444-4444-8444-444444444444',
    orderNumber: 'PED-2026-000123',
    cartId: cartExample.id,
    customerEmail: 'cliente@example.com',
    status: 'CONFIRMED',
    totalAmount: '699.80',
    items: [
      {
        id: '55555555-5555-4555-8555-555555555555',
        productId: productExample.id,
        productName: productExample.name,
        quantity: 2,
        unitPrice: '349.90',
        subtotal: '699.80',
      },
    ],
    createdAt: '2026-11-08T03:10:00.000Z',
    updatedAt: '2026-11-08T03:10:00.000Z',
  },
};

export const validationErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: 400 },
    error: { type: 'string', example: 'Bad Request' },
    message: { type: 'string', example: 'Validation failed' },
    details: { type: 'array', items: { type: 'object' } },
  },
};

export function errorSchema(
  statusCode: number,
  error: string,
  message: string,
) {
  return {
    type: 'object',
    properties: {
      statusCode: { type: 'integer', example: statusCode },
      error: { type: 'string', example: error },
      message: { type: 'string', example: message },
    },
    example: { statusCode, error, message },
  };
}

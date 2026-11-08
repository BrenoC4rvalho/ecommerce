const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
let cookie = '';

async function request(path, options = {}) {
  const response = await fetch(new URL(path, frontendUrl), {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...options.headers,
    },
  });
  const setCookie = response.headers.getSetCookie?.()[0];
  if (setCookie) cookie = setCookie.split(';', 1)[0];
  const body = await response.text();
  const payload = body ? JSON.parse(body) : undefined;
  if (!response.ok)
    throw new Error(
      `${options.method ?? 'GET'} ${path}: ${response.status} ${JSON.stringify(payload)}`,
    );
  return payload;
}

const products = await request('/api/products?isActive=true&page=1&limit=20');
const product = products.data.find((item) => item.stock >= 2);
if (!product) throw new Error('O teste exige ao menos um produto ativo com estoque >= 2.');

const cart = await request('/api/carts', { method: 'POST' });
let currentCart = await request(`/api/carts/${cart.id}`);
currentCart = await request(`/api/carts/${cart.id}/items`, {
  method: 'POST',
  body: JSON.stringify({ productId: product.id, quantity: 1 }),
});
const item = currentCart.items.find((entry) => entry.productId === product.id);
await request(`/api/carts/${cart.id}/items/${item.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ quantity: 2 }),
});
await request(`/api/carts/${cart.id}/items/${item.id}`, { method: 'DELETE' });
currentCart = await request(`/api/carts/${cart.id}/items`, {
  method: 'POST',
  body: JSON.stringify({ productId: product.id, quantity: 1 }),
});
const order = await request('/api/orders/checkout', {
  method: 'POST',
  body: JSON.stringify({ cartId: cart.id, customerEmail: 'frontend-smoke@ecommerce.test' }),
});

if (!order.id || !order.totalAmount) throw new Error('Resposta de checkout inválida.');
console.log(`Full purchase flow passed for order ${order.id}.`);

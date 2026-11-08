const PRODUCT_IMAGES = [
  '/images/fone-sem-fio.png',
  '/images/mochila-urbana.png',
  '/images/tenis-casual.png',
] as const;

export function getProductImage(productId: string) {
  let hash = 0;

  for (const character of productId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return PRODUCT_IMAGES[hash % PRODUCT_IMAGES.length];
}

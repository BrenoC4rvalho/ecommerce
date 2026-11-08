export const CART_EXPIRATION_DAYS = 7;

export function isCartExpired(updatedAt: Date, now = new Date()): boolean {
  return updatedAt.getTime() <= now.getTime() - CART_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
}

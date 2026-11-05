export function multiplyMoney(amount: string, quantity: number): string {
  const [whole, fraction = ''] = amount.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  const result = cents * BigInt(quantity);
  return `${result / 100n}.${(result % 100n).toString().padStart(2, '0')}`;
}

export function sumMoney(amounts: string[]): string {
  const total = amounts.reduce((sum, amount) => {
    const [whole, fraction = ''] = amount.split('.');
    return sum + BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  }, 0n);
  return `${total / 100n}.${(total % 100n).toString().padStart(2, '0')}`;
}

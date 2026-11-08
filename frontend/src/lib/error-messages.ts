import { ApiError } from '@/lib/api';

export type ErrorContext = 'cart' | 'add' | 'update' | 'remove' | 'checkout' | 'products';

export function getFriendlyError(error: unknown, fallback: string, context: ErrorContext = 'cart') {
  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  if (!(error instanceof ApiError)) return fallback;

  if (error.status === 400)
    return 'Não foi possível concluir a operação. Verifique os dados informados.';
  if (error.status === 404) return 'Este recurso não está mais disponível.';
  if (error.status === 409) {
    const backendMessage = error.message.toLowerCase();
    if (backendMessage.includes('already been checked out')) {
      return 'Este carrinho já foi finalizado.';
    }
    if (context === 'add') return 'Não foi possível adicionar o produto. Estoque insuficiente.';
    if (context === 'update') {
      return 'Não foi possível atualizar a quantidade. A quantidade solicitada excede o estoque disponível.';
    }
    if (context === 'checkout')
      return 'Não foi possível finalizar a compra. O estoque foi alterado.';
    return 'Não foi possível concluir a operação porque o estoque foi alterado.';
  }
  if (error.status === 422) return 'Seu carrinho está vazio ou possui um produto indisponível.';
  if (error.status >= 500) return 'Ocorreu um erro no servidor. Tente novamente.';

  return fallback;
}

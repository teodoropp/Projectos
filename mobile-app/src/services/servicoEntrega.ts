import { supabase } from '../lib/supabase';
import { RastreamentoEntrega } from '../types';

export async function obterRastreamentoAtual(idPedido: string): Promise<RastreamentoEntrega | null> {
  const { data, error } = await supabase
    .from('rastreamento_entregas')
    .select('*')
    .eq('id_pedido', idPedido)
    .single();

  if (error) {
    console.error('Erro ao buscar rastreamento:', error.message);
    return null;
  }

  return data as RastreamentoEntrega;
}

export function subscreverRastreamento(idPedido: string, aoAtualizar: (rastreamento: RastreamentoEntrega) => void) {
  return supabase
    .channel(`entrega:${idPedido}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rastreamento_entregas',
        filter: `id_pedido=eq.${idPedido}`
      },
      (payload) => {
        aoAtualizar(payload.new as RastreamentoEntrega);
      }
    )
    .subscribe();
}

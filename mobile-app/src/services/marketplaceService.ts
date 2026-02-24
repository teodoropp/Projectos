import { supabase } from '../lib/supabase';
import { Negocio, Produto, Reserva } from '../types';

export async function listarProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase.from('produtos').select('*').order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao listar produtos:', error.message);
    return [];
  }

  return (data ?? []) as Produto[];
}

export async function criarNegocio(payload: Omit<Negocio, 'id'>): Promise<{ sucesso: boolean; mensagem: string }> {
  const { error } = await supabase.from('negocios').insert(payload);

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }

  return { sucesso: true, mensagem: 'Negócio cadastrado com sucesso.' };
}

export async function criarReserva(payload: Omit<Reserva, 'id' | 'estado'>): Promise<{ sucesso: boolean; mensagem: string }> {
  const { error } = await supabase.from('reservas').insert({ ...payload, estado: 'pendente' });

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }

  return { sucesso: true, mensagem: 'Reserva criada com sucesso.' };
}

export async function obterResumoAdministrador() {
  const [negocios, produtos, reservas] = await Promise.all([
    supabase.from('negocios').select('*', { count: 'exact', head: true }),
    supabase.from('produtos').select('*', { count: 'exact', head: true }),
    supabase.from('reservas').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalNegocios: negocios.count ?? 0,
    totalProdutos: produtos.count ?? 0,
    totalReservas: reservas.count ?? 0
  };
}

export async function obterResumoEmpreendedor(idDono: string) {
  const { data: listaNegocios } = await supabase.from('negocios').select('*').eq('id_dono', idDono);
  const idsNegocios = (listaNegocios ?? []).map((negocio) => negocio.id);

  if (!idsNegocios.length) {
    return { totalNegocios: 0, totalProdutos: 0, totalReservas: 0, negociosGrandePorte: 0 };
  }

  const [produtos, reservas] = await Promise.all([
    supabase.from('produtos').select('*', { count: 'exact', head: true }).in('id_negocio', idsNegocios),
    supabase
      .from('reservas')
      .select('id, produtos!inner(id_negocio)', { count: 'exact', head: true })
      .in('produtos.id_negocio', idsNegocios)
  ]);

  return {
    totalNegocios: idsNegocios.length,
    totalProdutos: produtos.count ?? 0,
    totalReservas: reservas.count ?? 0,
    negociosGrandePorte: (listaNegocios ?? []).filter((item) => item.tipo_porte === 'grande').length
  };
}

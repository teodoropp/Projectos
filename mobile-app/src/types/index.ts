export type PerfilUtilizador = 'cliente' | 'empreendedor' | 'motoqueiro' | 'administrador';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  estoque: number;
  id_negocio: string;
}

export interface Negocio {
  id: string;
  id_dono: string;
  nome: string;
  categoria: string;
  tipo_porte: 'pequeno' | 'medio' | 'grande';
  taxa_comissao: number;
}

export interface Reserva {
  id: string;
  id_cliente: string;
  id_produto: string;
  quantidade: number;
  estado: 'pendente' | 'aprovada' | 'cancelada' | 'entregue';
}

export interface RastreamentoEntrega {
  id_pedido: string;
  latitude_motoqueiro: number;
  longitude_motoqueiro: number;
  latitude_cliente: number;
  longitude_cliente: number;
  atualizado_em: string;
}

create extension if not exists pgcrypto;

create table if not exists perfis (
  id uuid primary key references auth.users(id),
  nome_completo text,
  perfil text check (perfil in ('cliente', 'empreendedor', 'motoqueiro', 'administrador')) not null,
  criado_em timestamp with time zone default now()
);

create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  id_dono uuid not null references perfis(id),
  nome text not null,
  categoria text not null,
  tipo_porte text not null default 'pequeno' check (tipo_porte in ('pequeno', 'medio', 'grande')),
  taxa_comissao numeric(5,2) not null default 10.00,
  criado_em timestamp with time zone default now()
);

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  id_negocio uuid not null references negocios(id) on delete cascade,
  nome text not null,
  descricao text,
  preco numeric(10,2) not null,
  estoque integer not null default 0,
  criado_em timestamp with time zone default now()
);

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  id_cliente uuid not null references perfis(id),
  id_produto uuid not null references produtos(id),
  quantidade integer not null check (quantidade > 0),
  estado text not null default 'pendente' check (estado in ('pendente', 'aprovada', 'cancelada', 'entregue')),
  criado_em timestamp with time zone default now()
);

create table if not exists entregas (
  id uuid primary key default gen_random_uuid(),
  id_reserva uuid not null references reservas(id),
  id_motoqueiro uuid references perfis(id),
  estado text not null default 'atribuida' check (estado in ('atribuida', 'coletada', 'a_caminho', 'entregue')),
  criado_em timestamp with time zone default now()
);

create table if not exists rastreamento_entregas (
  id_pedido text primary key,
  latitude_motoqueiro numeric not null,
  longitude_motoqueiro numeric not null,
  latitude_cliente numeric not null,
  longitude_cliente numeric not null,
  atualizado_em timestamp with time zone default now()
);

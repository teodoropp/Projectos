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

-- =========================
-- FUNÇÕES DE APOIO (RLS)
-- =========================
create or replace function publico.eh_administrador()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from perfis p
    where p.id = auth.uid()
      and p.perfil = 'administrador'
  );
$$;

-- =========================
-- ATIVAR RLS
-- =========================
alter table perfis enable row level security;
alter table negocios enable row level security;
alter table produtos enable row level security;
alter table reservas enable row level security;
alter table entregas enable row level security;
alter table rastreamento_entregas enable row level security;

-- =========================
-- POLÍTICAS: PERFIS
-- =========================
drop policy if exists "perfis_select_proprio_ou_admin" on perfis;
create policy "perfis_select_proprio_ou_admin"
on perfis
for select
to authenticated
using (id = auth.uid() or publico.eh_administrador());

drop policy if exists "perfis_insert_proprio_ou_admin" on perfis;
create policy "perfis_insert_proprio_ou_admin"
on perfis
for insert
to authenticated
with check (id = auth.uid() or publico.eh_administrador());

drop policy if exists "perfis_update_proprio_ou_admin" on perfis;
create policy "perfis_update_proprio_ou_admin"
on perfis
for update
to authenticated
using (id = auth.uid() or publico.eh_administrador())
with check (id = auth.uid() or publico.eh_administrador());

-- =========================
-- POLÍTICAS: NEGÓCIOS
-- =========================
drop policy if exists "negocios_select_autenticados" on negocios;
create policy "negocios_select_autenticados"
on negocios
for select
to authenticated
using (true);

drop policy if exists "negocios_insert_dono_ou_admin" on negocios;
create policy "negocios_insert_dono_ou_admin"
on negocios
for insert
to authenticated
with check (id_dono = auth.uid() or publico.eh_administrador());

drop policy if exists "negocios_update_dono_ou_admin" on negocios;
create policy "negocios_update_dono_ou_admin"
on negocios
for update
to authenticated
using (id_dono = auth.uid() or publico.eh_administrador())
with check (id_dono = auth.uid() or publico.eh_administrador());

drop policy if exists "negocios_delete_dono_ou_admin" on negocios;
create policy "negocios_delete_dono_ou_admin"
on negocios
for delete
to authenticated
using (id_dono = auth.uid() or publico.eh_administrador());

-- =========================
-- POLÍTICAS: PRODUTOS
-- =========================
drop policy if exists "produtos_select_autenticados" on produtos;
create policy "produtos_select_autenticados"
on produtos
for select
to authenticated
using (true);

drop policy if exists "produtos_insert_dono_ou_admin" on produtos;
create policy "produtos_insert_dono_ou_admin"
on produtos
for insert
to authenticated
with check (
  publico.eh_administrador()
  or exists (
    select 1
    from negocios n
    where n.id = produtos.id_negocio
      and n.id_dono = auth.uid()
  )
);

drop policy if exists "produtos_update_dono_ou_admin" on produtos;
create policy "produtos_update_dono_ou_admin"
on produtos
for update
to authenticated
using (
  publico.eh_administrador()
  or exists (
    select 1
    from negocios n
    where n.id = produtos.id_negocio
      and n.id_dono = auth.uid()
  )
)
with check (
  publico.eh_administrador()
  or exists (
    select 1
    from negocios n
    where n.id = produtos.id_negocio
      and n.id_dono = auth.uid()
  )
);

drop policy if exists "produtos_delete_dono_ou_admin" on produtos;
create policy "produtos_delete_dono_ou_admin"
on produtos
for delete
to authenticated
using (
  publico.eh_administrador()
  or exists (
    select 1
    from negocios n
    where n.id = produtos.id_negocio
      and n.id_dono = auth.uid()
  )
);

-- =========================
-- POLÍTICAS: RESERVAS
-- =========================
drop policy if exists "reservas_select_participantes" on reservas;
create policy "reservas_select_participantes"
on reservas
for select
to authenticated
using (
  publico.eh_administrador()
  or id_cliente = auth.uid()
  or exists (
    select 1
    from produtos p
    join negocios n on n.id = p.id_negocio
    where p.id = reservas.id_produto
      and n.id_dono = auth.uid()
  )
);

drop policy if exists "reservas_insert_cliente_ou_admin" on reservas;
create policy "reservas_insert_cliente_ou_admin"
on reservas
for insert
to authenticated
with check (
  publico.eh_administrador()
  or id_cliente = auth.uid()
);

drop policy if exists "reservas_update_participantes" on reservas;
create policy "reservas_update_participantes"
on reservas
for update
to authenticated
using (
  publico.eh_administrador()
  or id_cliente = auth.uid()
  or exists (
    select 1
    from produtos p
    join negocios n on n.id = p.id_negocio
    where p.id = reservas.id_produto
      and n.id_dono = auth.uid()
  )
)
with check (
  publico.eh_administrador()
  or id_cliente = auth.uid()
  or exists (
    select 1
    from produtos p
    join negocios n on n.id = p.id_negocio
    where p.id = reservas.id_produto
      and n.id_dono = auth.uid()
  )
);

-- =========================
-- POLÍTICAS: ENTREGAS
-- =========================
drop policy if exists "entregas_select_participantes" on entregas;
create policy "entregas_select_participantes"
on entregas
for select
to authenticated
using (
  publico.eh_administrador()
  or id_motoqueiro = auth.uid()
  or exists (
    select 1
    from reservas r
    where r.id = entregas.id_reserva
      and r.id_cliente = auth.uid()
  )
  or exists (
    select 1
    from reservas r
    join produtos p on p.id = r.id_produto
    join negocios n on n.id = p.id_negocio
    where r.id = entregas.id_reserva
      and n.id_dono = auth.uid()
  )
);

drop policy if exists "entregas_insert_empreendedor_motoqueiro_admin" on entregas;
create policy "entregas_insert_empreendedor_motoqueiro_admin"
on entregas
for insert
to authenticated
with check (
  publico.eh_administrador()
  or id_motoqueiro = auth.uid()
  or exists (
    select 1
    from reservas r
    join produtos p on p.id = r.id_produto
    join negocios n on n.id = p.id_negocio
    where r.id = entregas.id_reserva
      and n.id_dono = auth.uid()
  )
);

drop policy if exists "entregas_update_participantes" on entregas;
create policy "entregas_update_participantes"
on entregas
for update
to authenticated
using (
  publico.eh_administrador()
  or id_motoqueiro = auth.uid()
  or exists (
    select 1
    from reservas r
    join produtos p on p.id = r.id_produto
    join negocios n on n.id = p.id_negocio
    where r.id = entregas.id_reserva
      and n.id_dono = auth.uid()
  )
)
with check (
  publico.eh_administrador()
  or id_motoqueiro = auth.uid()
  or exists (
    select 1
    from reservas r
    join produtos p on p.id = r.id_produto
    join negocios n on n.id = p.id_negocio
    where r.id = entregas.id_reserva
      and n.id_dono = auth.uid()
  )
);

-- =========================
-- POLÍTICAS: RASTREAMENTO
-- =========================
drop policy if exists "rastreamento_select_autenticados" on rastreamento_entregas;
create policy "rastreamento_select_autenticados"
on rastreamento_entregas
for select
to authenticated
using (true);

drop policy if exists "rastreamento_insert_motoqueiro_ou_admin" on rastreamento_entregas;
create policy "rastreamento_insert_motoqueiro_ou_admin"
on rastreamento_entregas
for insert
to authenticated
with check (
  publico.eh_administrador()
  or exists (
    select 1
    from perfis p
    where p.id = auth.uid()
      and p.perfil = 'motoqueiro'
  )
);

drop policy if exists "rastreamento_update_motoqueiro_ou_admin" on rastreamento_entregas;
create policy "rastreamento_update_motoqueiro_ou_admin"
on rastreamento_entregas
for update
to authenticated
using (
  publico.eh_administrador()
  or exists (
    select 1
    from perfis p
    where p.id = auth.uid()
      and p.perfil = 'motoqueiro'
  )
)
with check (
  publico.eh_administrador()
  or exists (
    select 1
    from perfis p
    where p.id = auth.uid()
      and p.perfil = 'motoqueiro'
  )
);

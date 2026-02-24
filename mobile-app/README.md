# App Mercado de Gelados (React Native + Supabase)

Aplicação móvel em português para:

- Clientes fazerem reservas de gelados e outros artigos.
- Empreendedores cadastrarem negócios e acompanharem desempenho.
- Plataforma cobrar comissão por pedido.
- Administrador acompanhar números gerais do sistema.
- Cliente rastrear entrega de motoqueiro no mapa HERE.

## Interface com Tailwind (NativeWind)

A UI foi reformulada com **Tailwind CSS** via **NativeWind**, com layout inspirado no modelo enviado
(cabeçalho com localização, busca, grade de categorias, bloco de ofertas e cards de pedidos).

## Funcionalidades implementadas

1. **Início** (`TelaReservasCliente`)
   - Home visual estilo app de delivery com Tailwind.
2. **Empreender** (`TelaEmpreendedor`)
   - Cria negócio na tabela `negocios`.
3. **Pedidos** (`TelaPainelEmpreendedor`)
   - Mostra resumo do empreendedor e painel parceiro para grande porte.
4. **Favoritos** (`TelaRastreamento`)
   - Rastreamento com HERE + Supabase Realtime.
5. **Perfil** (`TelaPainelAdministrador`)
   - Painel administrativo com totais.

## Setup

```bash
cd mobile-app
cp .env.example .env
npm install
npm run start
```

## Variáveis de ambiente

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_HERE_API_KEY`

## Banco de dados

Executa o SQL em `supabase/schema.sql` no Supabase SQL Editor.

Depois cria dados de teste mínimos:

- 1 registo em `perfis` (cliente)
- 1 registo em `perfis` (empreendedor)
- 1 negócio em `negocios`
- 2 produtos em `produtos`
- 1 registo em `rastreamento_entregas` com `id_pedido = pedido-demo-1`

## Estrutura dos ficheiros (em português)

- `src/navigation/NavegadorApp.tsx`
- `src/screens/TelaReservasCliente.tsx`
- `src/screens/TelaEmpreendedor.tsx`
- `src/screens/TelaRastreamento.tsx`
- `src/screens/TelaPainelEmpreendedor.tsx`
- `src/screens/TelaPainelAdministrador.tsx`
- `src/services/servicoMercado.ts`
- `src/services/servicoEntrega.ts`

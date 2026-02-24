# App Mercado de Gelados (React Native + Supabase)

Aplicação móvel em português para:

- Clientes fazerem reservas de gelados e outros artigos.
- Empreendedores cadastrarem negócios e acompanharem desempenho.
- Plataforma cobrar comissão por pedido.
- Administrador acompanhar números gerais do sistema.
- Cliente rastrear entrega de motoqueiro no mapa HERE.

## Funcionalidades implementadas

1. **Reservas** (`Reservas`)
   - Lista produtos da tabela `produtos`.
   - Cria reservas na tabela `reservas`.

2. **Cadastro de negócio** (`Empreender`)
   - Cria negócio na tabela `negocios`.
   - Define porte da loja (`pequeno`, `medio`, `grande`).

3. **Área do empreendedor** (`Painel`)
   - Mostra resumo do empreendedor.
   - Se existir loja de grande porte, ativa **Painel Admin de Parceiro**.

4. **Painel administrativo** (`Admin`)
   - Mostra totais de negócios, produtos e reservas.

5. **Entrega com GPS** (`Entrega`)
   - Lê `rastreamento_entregas`.
   - Atualiza em tempo real via Supabase Realtime.
   - Mostra posições no mapa HERE.

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

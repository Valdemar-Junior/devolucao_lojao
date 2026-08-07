-- ============================================================
--  VENDEDORES - cadastro fixo (tela de Configurações)
--  Evita o problema do nome digitado livre: o mesmo vendedor
--  escrito de formas diferentes vira linhas duplicadas no
--  relatório de penalidades. Com esta tabela, o usuário
--  SELECIONA o vendedor pelo nome exato cadastrado.
-- ============================================================
--  COMO USAR: painel do Supabase > SQL Editor > New query
--  > colar tudo > Run
--  É idempotente: pode rodar mais de uma vez sem erro.
-- ============================================================

-- ------------------------------------------------------------
-- 1) TABELA
-- ------------------------------------------------------------
create table if not exists public.vendedores (
  id bigint generated always as identity primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) BACKFILL: puxa vendedores que já existem no histórico
--    (NÃO cria vendedor fictício - só quem já teve registro)
--    (idempotente - não duplica nem apaga nada)
-- ------------------------------------------------------------
insert into public.vendedores (nome)
select distinct trim(vendedor)
from public.solicitacoes_devolucao
where vendedor is not null and trim(vendedor) <> ''
on conflict (nome) do nothing;

-- ------------------------------------------------------------
-- 3) SEGURANÇA (RLS) - mesmo padrão das demais configurações
-- ------------------------------------------------------------
alter table public.vendedores enable row level security;

create policy "vendedores_anon_all" on public.vendedores
  for all to anon using (true) with check (true);

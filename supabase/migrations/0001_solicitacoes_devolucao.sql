-- ============================================================
--  ESQUEMA COMPLETO - Lojão dos Móveis
--  Devoluções / Cancelamentos + Configurações + Penalidades
-- ============================================================
--  COMO USAR: painel do Supabase > SQL Editor > New query
--  > colar tudo > Run
--  Este arquivo SUBSTITUI o rascunho anterior (rode APENAS ele).
-- ============================================================

-- ------------------------------------------------------------
-- 1) MOTIVOS DE DEVOLUÇÃO
--    Lista exibida no select do formulário.
--    causa_penalidade = true  -> conta para a multa do vendedor
--    ativo = false            -> some do select, sem apagar histórico
-- ------------------------------------------------------------
create table if not exists public.motivos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  causa_penalidade boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Motivos iniciais (EXEMPLO - edite/delete conforme a realidade da loja)
insert into public.motivos (nome, causa_penalidade) values
  ('Produto errado enviado',                    true),
  ('Produto danificado no transporte',          true),
  ('Produto com defeito de fabricação',         true),
  ('Erro na entrega (endereço/prazo)',          true),
  ('Erro de cadastro do pedido',                true),
  ('Erro de lançamento da venda',               true),
  ('Arrependimento do cliente',                 false),
  ('Troca de produto (cliente)',                false),
  ('Desistência / cancelamento',                false)
on conflict (nome) do nothing;

-- ------------------------------------------------------------
-- 2) SOLICITANTES
--    Funcionários que abrem as solicitações (select do formulário)
-- ------------------------------------------------------------
create table if not exists public.solicitantes (
  id bigint generated always as identity primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.solicitantes (nome) values
  ('João'), ('Emerson'), ('Thiara'), ('Thais'), ('Cristiano'),
  ('Junior'), ('Micael'), ('Irvine'), ('Stephanie')
on conflict (nome) do nothing;

-- ------------------------------------------------------------
-- 3) FILIAIS
--    (opcional/recomendado - mantém o select de filial no padrão)
-- ------------------------------------------------------------
create table if not exists public.filiais (
  id bigint generated always as identity primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.filiais (nome) values
  ('Loja Assu'), ('Loja Mossoró')
on conflict (nome) do nothing;

-- ------------------------------------------------------------
-- 4) SOLICITAÇÕES DE DEVOLUÇÃO (HISTÓRICO)
--    Cada envio do formulário vira um registro aqui.
--    motivo_id  -> chave para a tabela motivos (permite contar
--                  penalidades); motivo_devolucao é o texto na
--                  hora do envio (snapshot, não muda se editar)
-- ------------------------------------------------------------
create table if not exists public.solicitacoes_devolucao (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  filial text not null,
  solicitante text not null,
  tipo_solicitacao text not null,
  tipo_devolucao text not null,
  numero_lancamento bigint not null,
  tipo_operacao text,
  nome_cliente text,
  cpf_cnpj text,
  vendedor text,
  data_hora_solicitacao text,
  motivo_id bigint references public.motivos (id),
  motivo_devolucao text,
  itens jsonb not null default '[]'::jsonb,
  mensagem text
);

-- Índices para consultas rápidas
create index if not exists solic_devol_created_at_idx
  on public.solicitacoes_devolucao (created_at desc);
create index if not exists solic_devol_numero_lancamento_idx
  on public.solicitacoes_devolucao (numero_lancamento);
create index if not exists solic_devol_vendedor_idx
  on public.solicitacoes_devolucao (vendedor);
create index if not exists solic_devol_motivo_idx
  on public.solicitacoes_devolucao (motivo_id);

-- ------------------------------------------------------------
-- 5) VIEW: OCORRÊNCIAS POR VENDEDOR (detalhe)
--    Lista cada devolução que gera multa, com a numeração
--    (1ª, 2ª, 3ª, 4ª...) por vendedor e o valor da multa.
-- ------------------------------------------------------------
create or replace view public.vw_ocorrencias_vendedor as
with occ as (
  select
    sd.id as solicitacao_id,
    sd.created_at,
    sd.vendedor,
    m.nome as motivo,
    sd.numero_lancamento,
    sd.filial,
    sd.nome_cliente,
    row_number() over (partition by sd.vendedor order by sd.created_at) as n
  from public.solicitacoes_devolucao sd
  join public.motivos m on m.id = sd.motivo_id
  where m.causa_penalidade = true
)
select
  *,
  case when n <= 3 then 30.00 else 50.00 end as multa
from occ
order by created_at desc;

-- ------------------------------------------------------------
-- 6) VIEW: PENALIDADES POR VENDEDOR (resumo)
--    Regra: R$ 30,00 nas ocorrências 1ª, 2ª e 3ª;
--    R$ 50,00 da 4ª ocorrência em diante.
--    Conta apenas motivos com causa_penalidade = true.
-- ------------------------------------------------------------
create or replace view public.vw_penalidades_vendedores as
with ocorrencias as (
  select
    sd.id,
    sd.vendedor,
    sd.created_at,
    row_number() over (partition by sd.vendedor order by sd.created_at) as n
  from public.solicitacoes_devolucao sd
  join public.motivos m on m.id = sd.motivo_id
  where m.causa_penalidade = true
)
select
  vendedor,
  count(*) as total_erros,
  count(*) filter (where n <= 3) as erros_taxa_30,
  count(*) filter (where n > 3) as erros_taxa_50,
  (count(*) filter (where n <= 3)) * 30.00
    + (count(*) filter (where n > 3)) * 50.00 as valor_penalidade
from ocorrencias
group by vendedor
order by valor_penalidade desc;

-- ------------------------------------------------------------
-- 7) SEGURANÇA (RLS)
--    App sem login por enquanto: anon pode ler tudo e escrever.
--    Quando houver login, restringimos por usuário.
-- ------------------------------------------------------------
alter table public.motivos enable row level security;
alter table public.solicitantes enable row level security;
alter table public.filiais enable row level security;
alter table public.solicitacoes_devolucao enable row level security;

-- motivos / solicitantes / filiais: leitura + escrita (tela de configurações)
create policy "motivos_anon_all" on public.motivos
  for all to anon using (true) with check (true);
create policy "solicitantes_anon_all" on public.solicitantes
  for all to anon using (true) with check (true);
create policy "filiais_anon_all" on public.filiais
  for all to anon using (true) with check (true);

-- histórico: inserir (app) + ler (histórico/relatório)
create policy "solicitacoes_anon_insert" on public.solicitacoes_devolucao
  for insert to anon with check (true);
create policy "solicitacoes_anon_select" on public.solicitacoes_devolucao
  for select to anon using (true);

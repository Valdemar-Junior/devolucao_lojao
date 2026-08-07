-- ============================================================
--  VIEW DE OCORRÊNCIAS com o tipo da solicitação
--  Expõe sd.tipo_solicitacao para a tela de Penalidades marcar
--  com badge as ocorrências inseridas como "Penalidade avulsa"
--  (sem devolução). Nada mais muda no comportamento.
-- ============================================================
--  COMO USAR: painel do Supabase > SQL Editor > New query
--  > colar tudo > Run
--  É idempotente: pode rodar mais de uma vez sem erro.
-- ============================================================

-- DROP + CREATE porque o Postgres não renomeia/insere colunas
-- no meio em "create or replace view" (erro 42P16). Apagar e
-- recriar é 100% seguro: a view é recalculada do zero.
drop view if exists public.vw_ocorrencias_vendedor;

create view public.vw_ocorrencias_vendedor as
with occ as (
  select
    sd.id as solicitacao_id,
    sd.created_at,
    sd.vendedor,
    m.nome as motivo,
    sd.numero_lancamento,
    sd.filial,
    sd.nome_cliente,
    sd.detalhes,
    sd.tipo_solicitacao,
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

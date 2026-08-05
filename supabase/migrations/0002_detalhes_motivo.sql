-- ============================================================
--  DETALHES DO MOTIVO - campo de texto livre
--  Adiciona a coluna `detalhes` no histórico de devoluções
--  para registrar por extenso o que aconteceu em cada
--  devolução (observações sobre o motivo selecionado).
-- ============================================================
--  COMO USAR: painel do Supabase > SQL Editor > New query
--  > colar tudo > Run
--  É idempotente: pode rodar mais de uma vez sem erro.
-- ============================================================

-- ------------------------------------------------------------
-- 1) NOVA COLUNA
--    Texto livre, opcional. Vem do campo "Detalhes do motivo"
--    do formulário de solicitação.
-- ------------------------------------------------------------
alter table public.solicitacoes_devolucao
  add column if not exists detalhes text;

-- ------------------------------------------------------------
-- 2) VIEW DE OCORRÊNCIAS ATUALIZADA
--    Inclui sd.detalhes para a tela de Vendedores e o PDF.
--    Usamos DROP + CREATE porque o Postgres NÃO renomeia
--    colunas em "create or replace view" (erro 42P16) e a
--    ordem das colunas mudou ao adicionar o detalhes.
--    Apagar e recriar é 100% seguro: a view é recalculada
--    do zero e nada depende dela no banco.
-- ------------------------------------------------------------
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
-- 3) (OPCIONAL) PREENCHE DETALHES DE EXEMPLO
--    Aplica textos fictícios nas devoluções da SIMULAÇÃO que
--    você já rodou, pra você ver o campo na tela imediatamente.
--    Se não quiser, pode apagar este bloco (do UPDATE ao ;).
-- ------------------------------------------------------------
update public.solicitacoes_devolucao
set detalhes = case
  when motivo_devolucao ilike '%danificado%' then
    'Produto chegou com amassado na lateral e a embalagem violada.'
  when motivo_devolucao ilike '%endere%' then
    'Endereço informado errado no ato da venda; cliente não recebeu a mercadoria.'
  when motivo_devolucao ilike '%cadastro%' then
    'CPF informado errado pelo cliente no momento da venda.'
  when motivo_devolucao ilike '%lançamento%' or motivo_devolucao ilike '%lancamento%' then
    'Venda lançada em duplicidade no sistema.'
  when motivo_devolucao ilike '%errado enviado%' then
    'Foi enviado outro modelo do que o pedido solicitava.'
  else null
end
where mensagem = 'SIMULAÇÃO' and detalhes is null;

-- ============================================================
--  DADOS DE DEMONSTRAÇÃO - SOLICITAÇÕES / DEVOLUÇÕES
--  Popula a tela "Solicitações" com devoluções fictícias
--  espalhadas entre Hoje, Últimos 7 dias, Mês atual e
--  Mês anterior (para todos os filtros de data mostrarem algo).
-- ============================================================
--  COMO USAR: painel do Supabase > SQL Editor > New query
--  > colar tudo > Run
--  Pode rodar mais de uma vez SEM duplicar (guarda por
--  número de lançamento). Os itens e a mensagem do WhatsApp
--  são gerados automaticamente.
-- ============================================================

-- ------------------------------------------------------------
-- 1) INSERE AS DEVOLUÇÕES (só insere se o lançamento ainda
--    não existir, para não duplicar ao rodar de novo)
-- ------------------------------------------------------------
insert into public.solicitacoes_devolucao
  (created_at, filial, solicitante, tipo_solicitacao, tipo_devolucao,
   numero_lancamento, tipo_operacao, nome_cliente, cpf_cnpj, vendedor,
   data_hora_solicitacao, motivo_id, motivo_devolucao, itens, detalhes)
select
  v.created_at,
  v.filial,
  v.solicitante,
  v.tipo_solicitacao,
  v.tipo_devolucao,
  v.numero_lancamento,
  v.tipo_operacao,
  v.nome_cliente,
  v.cpf_cnpj,
  v.vendedor,
  v.data_hora_solicitacao,
  (select id from public.motivos m where m.nome = v.motivo_devolucao),
  v.motivo_devolucao,
  v.itens::jsonb,
  v.detalhes
from (values
  -- ---------- HOJE (05/08) ----------
  ('2026-08-05 09:15:00-03'::timestamptz, 'Loja Assu', 'Thiara', 'Devolução com crédito', 'Parcial',
   46001::bigint, 'Venda a prazo', 'Maria Oliveira', '123.456.789-01', 'Carlos Souza',
   '05/08/2026, 09:15:00', 'Produto errado enviado',
   '[{"sequencia_item":1,"codigo_produto":"SOF-014","nome_produto":"Sofá 3 lugares retrátil","quantidade":1,"valor_unitario":1299.00}]'::jsonb,
   'Foi enviado outro modelo do que o pedido solicitava: o cliente pediu o sofá retrátil e chegou o fixo.'),

  ('2026-08-05 11:40:00-03'::timestamptz, 'Loja Mossoró', 'Emerson', 'Devolução sem crédito', 'Total',
   46002::bigint, 'Venda a prazo', 'José Almeida', '987.654.321-00', 'Paula Reis',
   '05/08/2026, 11:40:00', 'Produto danificado no transporte',
   '[{"sequencia_item":1,"codigo_produto":"ARM-021","nome_produto":"Armário 4 portas","quantidade":1,"valor_unitario":899.90}]'::jsonb,
   'Armário chegou com a lateral trincada e uma das portas amassada.'),

  ('2026-08-05 15:05:00-03'::timestamptz, 'Loja Assu', 'João', 'Cancelamento', 'Total',
   46003::bigint, 'Venda a vista', 'Fernanda Lima', '456.789.123-45', 'Ana Lima',
   '05/08/2026, 15:05:00', 'Desistência / cancelamento',
   '[{"sequencia_item":1,"codigo_produto":"MES-008","nome_produto":"Mesa de jantar 6 cadeiras","quantidade":1,"valor_unitario":1499.00}]'::jsonb,
   'Cliente desistiu após receber proposta da concorrência; venda cancelada antes da entrega.'),

  -- ---------- ESTA SEMANA (01 a 04/08) ----------
  ('2026-08-04 10:30:00-03'::timestamptz, 'Loja Mossoró', 'Thais', 'Devolução com crédito', 'Parcial',
   46004::bigint, 'Venda a prazo', 'Roberto Nunes', '321.654.987-11', 'Jorge Ferreira',
   '04/08/2026, 10:30:00', 'Erro na entrega (endereço/prazo)',
   '[{"sequencia_item":1,"codigo_produto":"COL-033","nome_produto":"Colchão Queen","quantidade":1,"valor_unitario":1049.00}]'::jsonb,
   'Entregador foi ao endereço antigo informado no cadastro; mercadoria voltou para o centro de distribuição.'),

  ('2026-08-04 16:20:00-03'::timestamptz, 'Loja Assu', 'Junior', 'Devolução com crédito', 'Total',
   46005::bigint, 'Venda a prazo', 'Patrícia Souza', '654.321.987-22', 'Rafael Nunes',
   '04/08/2026, 16:20:00', 'Produto com defeito de fabricação',
   '[{"sequencia_item":1,"codigo_produto":"GUA-045","nome_produto":"Guarda-roupa 6 portas","quantidade":1,"valor_unitario":1899.00}]'::jsonb,
   'Gaveta do guarda-roupa não fecha; acionado a assistência técnica.'),

  ('2026-08-03 09:50:00-03'::timestamptz, 'Loja Assu', 'Micael', 'Devolução sem crédito', 'Parcial',
   46006::bigint, 'Venda a vista', 'Antônio Carlos', '147.258.369-33', 'Carlos Souza',
   '03/08/2026, 09:50:00', 'Erro de cadastro do pedido',
   '[{"sequencia_item":1,"codigo_produto":"RAC-017","nome_produto":"Rack para TV","quantidade":1,"valor_unitario":349.90},{"sequencia_item":2,"codigo_produto":"POL-026","nome_produto":"Poltrona reclinável","quantidade":2,"valor_unitario":399.90}]'::jsonb,
   'CPF informado errado pelo cliente no momento da venda.'),

  ('2026-08-02 14:10:00-03'::timestamptz, 'Loja Mossoró', 'Irvine', 'Devolução com crédito', 'Total',
   46007::bigint, 'Venda a prazo', 'Marina Costa', '369.258.147-44', 'Paula Reis',
   '02/08/2026, 14:10:00', 'Erro de lançamento da venda',
   '[{"sequencia_item":1,"codigo_produto":"CAM-052","nome_produto":"Cama box casal","quantidade":1,"valor_unitario":799.00}]'::jsonb,
   'Venda lançada em duplicidade no sistema.'),

  -- ---------- FIM DE JULHO (mês anterior / últimos 7 dias) ----------
  ('2026-07-31 15:45:00-03'::timestamptz, 'Loja Assu', 'Stephanie', 'Devolução com crédito', 'Parcial',
   46008::bigint, 'Venda a prazo', 'Diego Martins', '258.147.369-55', 'Ana Lima',
   '31/07/2026, 15:45:00', 'Troca de produto (cliente)',
   '[{"sequencia_item":1,"codigo_produto":"SOF-015","nome_produto":"Sofá 2 lugares","quantidade":1,"valor_unitario":999.00}]'::jsonb,
   'Cliente trocou o modelo do sofá por um maior.'),

  ('2026-07-30 11:25:00-03'::timestamptz, 'Loja Mossoró', 'Cristiano', 'Devolução sem crédito', 'Total',
   46009::bigint, 'Venda a vista', 'Luana Ferreira', '741.852.963-66', 'Jorge Ferreira',
   '30/07/2026, 11:25:00', 'Produto danificado no transporte',
   '[{"sequencia_item":1,"codigo_produto":"MEC-019","nome_produto":"Mesa de centro vidro","quantidade":1,"valor_unitario":429.00}]'::jsonb,
   'Vidro da mesa de centro estilhaçou durante o transporte.'),

  -- ---------- MÊS ANTERIOR (julho) ----------
  ('2026-07-22 09:30:00-03'::timestamptz, 'Loja Assu', 'Thiara', 'Devolução com crédito', 'Total',
   46010::bigint, 'Venda a prazo', 'Sérgio Ramos', '963.741.852-77', 'Rafael Nunes',
   '22/07/2026, 09:30:00', 'Produto errado enviado',
   '[{"sequencia_item":1,"codigo_produto":"GUA-046","nome_produto":"Guarda-roupa 3 portas","quantidade":1,"valor_unitario":1249.00}]'::jsonb,
   'Enviado o modelo com porta de correr ao invés do articulado.'),

  ('2026-07-14 16:05:00-03'::timestamptz, 'Loja Mossoró', 'Emerson', 'Devolução com crédito', 'Parcial',
   46011::bigint, 'Venda a prazo', 'Beatriz Lopes', '852.963.741-88', 'Carlos Souza',
   '14/07/2026, 16:05:00', 'Arrependimento do cliente',
   '[{"sequencia_item":1,"codigo_produto":"COL-034","nome_produto":"Colchão Solteiro","quantidade":1,"valor_unitario":649.00}]'::jsonb,
   'Cliente se arrependeu da cor do colchão após receber em casa.'),

  ('2026-07-05 10:15:00-03'::timestamptz, 'Loja Assu', 'João', 'Cancelamento', 'Total',
   46012::bigint, 'Venda a prazo', 'Paulo Henrique', '123.987.456-99', 'Paula Reis',
   '05/07/2026, 10:15:00', 'Desistência / cancelamento',
   '[{"sequencia_item":1,"codigo_produto":"CJQ-010","nome_produto":"Conjunto quarto completo","quantidade":1,"valor_unitario":2199.00}]'::jsonb,
   'Cliente cancelou pois o financiamento não foi aprovado.')
) as v(created_at, filial, solicitante, tipo_solicitacao, tipo_devolucao,
        numero_lancamento, tipo_operacao, nome_cliente, cpf_cnpj, vendedor,
        data_hora_solicitacao, motivo_devolucao, itens, detalhes)
where not exists (
  select 1 from public.solicitacoes_devolucao sd
  where sd.numero_lancamento = v.numero_lancamento
);

-- ------------------------------------------------------------
-- 2) GERA A MENSAGEM DO WHATSAPP (mesmo formato do app)
--    Aplica só nos registros recém-inseridos (mensagem vazia).
-- ------------------------------------------------------------
update public.solicitacoes_devolucao sd
set mensagem = (
  '📝 Solicitação de Devolução/Cancelamento - Lojão dos Móveis' || E'\n' ||
  E'\n' ||
  '⏰ Data e Hora: ' || coalesce(sd.data_hora_solicitacao, '') || E'\n' ||
  E'\n' ||
  '📍 Filial: ' || sd.filial || E'\n' ||
  '👤 Solicitante: ' || sd.solicitante || E'\n' ||
  '🔁 Tipo de Devolução: ' || sd.tipo_devolucao || E'\n' ||
  '🔄 Tipo de Solicitação: ' || sd.tipo_solicitacao || E'\n' ||
  '🧾 Nº Lançamento: ' || sd.numero_lancamento || E'\n' ||
  '🚚 Tipo de Operação: ' || coalesce(sd.tipo_operacao, 'Não informado') || E'\n' ||
  '🧑‍💼 Vendedor: ' || coalesce(sd.vendedor, 'Não informado') || E'\n' ||
  E'\n' ||
  '👥 Cliente: ' || coalesce(sd.nome_cliente, 'Não informado') || E'\n' ||
  '🆔 CPF/CNPJ: ' || coalesce(sd.cpf_cnpj, 'Não informado') || E'\n' ||
  E'\n' ||
  '📦 Item(s) da Devolução:' || E'\n' ||
  coalesce((
    select string_agg(
      E'\n' || 'Item ' || o.ordinality::text || E'\n' ||
      'Produto: ' || (o.value->>'nome_produto') || E'\n' ||
      'Código: ' || (o.value->>'codigo_produto') || E'\n' ||
      'Quantidade: ' || (o.value->>'quantidade') || E'\n' ||
      'Valor unitário: R$ ' || (o.value->>'valor_unitario') || E'\n' ||
      'Total: R$ ' ||
        round(((o.value->>'quantidade')::numeric) * ((o.value->>'valor_unitario')::numeric), 2)::text,
      E'\n'
    )
    from jsonb_array_elements(sd.itens) with ordinality as o(value, ordinality)
  ), '') ||
  E'\n' ||
  E'\n' ||
  '✍️ Motivo: ' || coalesce(sd.motivo_devolucao, '') ||
  case when sd.detalhes is not null and sd.detalhes <> ''
    then E'\n' || '📝 Detalhes: ' || sd.detalhes
    else '' end
)
where sd.mensagem is null
  and sd.created_at >= '2026-07-01'
  and sd.numero_lancamento in (46001, 46002, 46003, 46004, 46005, 46006, 46007,
                               46008, 46009, 46010, 46011, 46012);

-- ------------------------------------------------------------
-- 3) CONFERÊNCIA: lista o que foi inserido (opcional)
-- ------------------------------------------------------------
select
  to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
  filial,
  solicitante,
  tipo_solicitacao,
  numero_lancamento,
  vendedor,
  nome_cliente as cliente,
  motivo_devolucao as motivo,
  jsonb_array_length(itens) as itens
from public.solicitacoes_devolucao
where numero_lancamento between 46001 and 46012
order by created_at desc;

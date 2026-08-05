-- ============================================================
--  SIMULAÇÃO DE DEVOLUÇÕES - dados fictícios
--  Para testar a tela "Vendedores com Erros"
-- ============================================================
--  COMO USAR: painel do Supabase > SQL Editor > New query > colar > Run
--
--  Todas as linhas desta simulação ficam marcadas com
--  mensagem = 'SIMULAÇÃO' para limpeza segura depois:
--    DELETE FROM public.solicitacoes_devolucao WHERE mensagem = 'SIMULAÇÃO';
--  (Isso NÃO apaga solicitações reais.)
--
--  IMPORTANTE: os motivos são localizados pelo NOME (sub-select).
--  Rode este script DEPOIS de ajustar os nomes dos motivos na tela
--  de Configurações. Se renomear um motivo depois, os registros
--  desta simulação ficam sem vínculo (motivo_id nulo).
--
--  A simulação tem: 5 vendedores com multa (R$ 510,00 no total) +
--  1 vendedor com devoluções que NÃO causam penalidade (para
--  mostrar que ele não aparece na tela).
-- ============================================================

begin;

insert into public.solicitacoes_devolucao
  (created_at, filial, solicitante, tipo_solicitacao, tipo_devolucao,
   numero_lancamento, tipo_operacao, nome_cliente, cpf_cnpj, vendedor,
   motivo_id, motivo_devolucao, mensagem)
values
  -- Carlos Souza: 5 erros (3x R$30 + 2x R$50 = R$190) + 2 sem penalidade
  ('2026-01-08 09:15:00-03', 'Loja Assu', 'João', 'Devolução com crédito', 'Total',
   45871, 'Venda', 'Maria Oliveira', '123.456.789-01', 'Carlos Souza',
   (select id from public.motivos where nome = 'Produto errado enviado'), 'Produto errado enviado', 'SIMULAÇÃO'),
  ('2026-02-12 14:30:00-03', 'Loja Mossoró', 'Emerson', 'Devolução sem crédito', 'Parcial',
   45902, 'Venda', 'José Santos', '987.654.321-00', 'Carlos Souza',
   (select id from public.motivos where nome = 'Erro na entrega (endereço/prazo)'), 'Erro na entrega', 'SIMULAÇÃO'),
  ('2026-03-05 10:00:00-03', 'Loja Assu', 'Thiara', 'Devolução com crédito', 'Total',
   45955, 'Venda', 'Ana Pereira', '111.222.333-44', 'Carlos Souza',
   (select id from public.motivos where nome = 'Troca de produto (cliente)'), 'Troca de produto', 'SIMULAÇÃO'),
  ('2026-03-20 16:45:00-03', 'Loja Assu', 'João', 'Devolução com crédito', 'Parcial',
   45980, 'Venda', 'Pedro Alves', '555.666.777-88', 'Carlos Souza',
   (select id from public.motivos where nome = 'Produto danificado no transporte'), 'Produto danificado', 'SIMULAÇÃO'),
  ('2026-04-25 11:20:00-03', 'Loja Mossoró', 'Thais', 'Cancelamento', 'Total',
   46011, 'Venda', 'Carla Mendes', '999.888.777-66', 'Carlos Souza',
   (select id from public.motivos where nome = 'Erro de cadastro do pedido'), 'Erro de cadastro', 'SIMULAÇÃO'),
  ('2026-05-15 15:10:00-03', 'Loja Assu', 'Emerson', 'Devolução com crédito', 'Total',
   46047, 'Venda', 'Roberto Lima', '333.444.555-66', 'Carlos Souza',
   (select id from public.motivos where nome = 'Arrependimento do cliente'), 'Arrependimento', 'SIMULAÇÃO'),
  ('2026-06-02 08:55:00-03', 'Loja Mossoró', 'Junior', 'Devolução sem crédito', 'Total',
   46089, 'Venda', 'Fernanda Costa', '777.888.999-00', 'Carlos Souza',
   (select id from public.motivos where nome = 'Erro de lançamento da venda'), 'Erro de lançamento', 'SIMULAÇÃO'),

  -- Ana Lima: 3 erros (3x R$30 = R$90)
  ('2026-01-20 13:40:00-03', 'Loja Assu', 'Micael', 'Devolução com crédito', 'Total',
   45890, 'Venda', 'Bruno Ferreira', '222.333.444-55', 'Ana Lima',
   (select id from public.motivos where nome = 'Produto com defeito de fabricação'), 'Defeito de fabricação', 'SIMULAÇÃO'),
  ('2026-03-11 09:05:00-03', 'Loja Mossoró', 'Irvine', 'Devolução sem crédito', 'Parcial',
   45970, 'Venda', 'Juliana Almeida', '444.555.666-77', 'Ana Lima',
   (select id from public.motivos where nome = 'Erro na entrega (endereço/prazo)'), 'Erro na entrega', 'SIMULAÇÃO'),
  ('2026-05-08 17:25:00-03', 'Loja Assu', 'Stephanie', 'Cancelamento', 'Total',
   46032, 'Venda', 'Ricardo Souza', '666.777.888-99', 'Ana Lima',
   (select id from public.motivos where nome = 'Produto errado enviado'), 'Produto errado enviado', 'SIMULAÇÃO'),

  -- Marcos Silva: 1 erro (R$30)
  ('2026-02-03 10:35:00-03', 'Loja Mossoró', 'João', 'Devolução com crédito', 'Total',
   45912, 'Venda', 'Patrícia Gomes', '101.112.131-41', 'Marcos Silva',
   (select id from public.motivos where nome = 'Produto danificado no transporte'), 'Produto danificado', 'SIMULAÇÃO'),

  -- Paula Reis: 4 erros (3x R$30 + 1x R$50 = R$140)
  ('2026-01-15 09:50:00-03', 'Loja Assu', 'Emerson', 'Devolução sem crédito', 'Total',
   45879, 'Venda', 'Eduardo Pinto', '202.223.242-52', 'Paula Reis',
   (select id from public.motivos where nome = 'Erro de cadastro do pedido'), 'Erro de cadastro', 'SIMULAÇÃO'),
  ('2026-03-25 14:15:00-03', 'Loja Assu', 'Thiara', 'Devolução com crédito', 'Parcial',
   45988, 'Venda', 'Vanessa Rocha', '303.334.353-63', 'Paula Reis',
   (select id from public.motivos where nome = 'Produto errado enviado'), 'Produto errado enviado', 'SIMULAÇÃO'),
  ('2026-04-10 11:45:00-03', 'Loja Mossoró', 'Thais', 'Cancelamento', 'Total',
   46005, 'Venda', 'André Cardoso', '404.445.464-74', 'Paula Reis',
   (select id from public.motivos where nome = 'Erro de lançamento da venda'), 'Erro de lançamento', 'SIMULAÇÃO'),
  ('2026-06-18 16:20:00-03', 'Loja Assu', 'Junior', 'Devolução com crédito', 'Total',
   46102, 'Venda', 'Luciana Dias', '505.556.575-85', 'Paula Reis',
   (select id from public.motivos where nome = 'Produto danificado no transporte'), 'Produto danificado', 'SIMULAÇÃO'),

  -- Jorge Ferreira: 2 erros (2x R$30 = R$60)
  ('2026-02-20 08:30:00-03', 'Loja Mossoró', 'Micael', 'Devolução com crédito', 'Total',
   45925, 'Venda', 'Sérgio Moura', '606.667.686-96', 'Jorge Ferreira',
   (select id from public.motivos where nome = 'Erro na entrega (endereço/prazo)'), 'Erro na entrega', 'SIMULAÇÃO'),
  ('2026-04-05 13:55:00-03', 'Loja Assu', 'Irvine', 'Cancelamento', 'Total',
   45996, 'Venda', 'Beatriz Nunes', '707.778.797-07', 'Jorge Ferreira',
   (select id from public.motivos where nome = 'Erro de cadastro do pedido'), 'Erro de cadastro', 'SIMULAÇÃO'),

  -- Fernanda Rocha: apenas devoluções SEM penalidade (não aparece na tela)
  ('2026-02-28 10:10:00-03', 'Loja Mossoró', 'Stephanie', 'Devolução com crédito', 'Total',
   45940, 'Venda', 'Diego Barbosa', '808.889.808-18', 'Fernanda Rocha',
   (select id from public.motivos where nome = 'Arrependimento do cliente'), 'Arrependimento', 'SIMULAÇÃO'),
  ('2026-04-22 15:05:00-03', 'Loja Assu', 'João', 'Devolução sem crédito', 'Parcial',
   46020, 'Venda', 'Camila Teixeira', '909.990.919-29', 'Fernanda Rocha',
   (select id from public.motivos where nome = 'Troca de produto (cliente)'), 'Troca de produto', 'SIMULAÇÃO');

commit;

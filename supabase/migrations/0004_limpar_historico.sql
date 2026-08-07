-- ============================================================
--  LIMPEZA DO BANCO - Lojão dos Móveis
--  Apaga TODO o histórico de devoluções (solicitacoes_devolucao)
--  e mantém SOMENTE as configurações:
--    - motivos      (Configurações > Motivos)
--    - solicitantes (Configurações > Solicitantes)
--    - filiais      (Configurações > Filiais)
--  As views de penalidades ficam automaticamente vazias
--  (são recalculadas na hora, não guardam dados).
--  Pode rodar quantas vezes quiser: não quebra nada.
-- ============================================================

truncate table public.solicitacoes_devolucao restart identity;

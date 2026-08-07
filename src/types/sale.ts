export interface SaleItem {
  sequencia_item: number;
  codigo_produto: string;
  nome_produto: string;
  quantidade_vendida: number;
  valor_unitario: number;
}

export interface Sale {
  numero_lancamento: number;
  tipo_operacao: string;
  nome_cliente: string;
  cpf_cnpj: string;
  vendedor?: string;
  itens_vendidos: SaleItem[];
}

export interface ReturnItem {
  sequencia_item: number;
  codigo_produto: string;
  nome_produto: string;
  quantidade: number;
  valor_unitario: number;
}

export interface ReturnRequest {
  filial: string;
  solicitante: string;
  tipo_solicitacao: string;
  tipo_devolucao: string;
  numero_lancamento: number;
  tipo_operacao: string;
  nome_cliente: string;
  cpf_cnpj: string;
  vendedor?: string;
  data_hora_solicitacao?: string;
  itens_selecionados: ReturnItem[];
  motivo_devolucao: string;
  detalhes?: string;
}

export interface Motivo {
  id: number;
  nome: string;
  causa_penalidade: boolean;
  ativo?: boolean;
}

export interface Solicitante {
  id: number;
  nome: string;
  ativo?: boolean;
}

export interface Filial {
  id: number;
  nome: string;
  ativo?: boolean;
}

export interface Vendedor {
  id: number;
  nome: string;
  ativo?: boolean;
}

export interface PenalidadeVendedor {
  vendedor: string;
  total_erros: number;
  erros_taxa_30: number;
  erros_taxa_50: number;
  valor_penalidade: number;
}

export interface OcorrenciaVendedor {
  solicitacao_id: number;
  created_at: string;
  vendedor: string;
  motivo: string;
  numero_lancamento: number;
  filial: string;
  nome_cliente: string;
  detalhes?: string | null;
  n: number;
  multa: number;
}

export interface SolicitacaoDevolucao {
  id: number;
  created_at: string;
  filial: string;
  solicitante: string;
  tipo_solicitacao: string;
  tipo_devolucao: string;
  numero_lancamento: number;
  tipo_operacao: string | null;
  nome_cliente: string | null;
  cpf_cnpj: string | null;
  vendedor: string | null;
  data_hora_solicitacao: string | null;
  motivo_id: number | null;
  motivo_devolucao: string | null;
  detalhes?: string | null;
  itens: {
    sequencia_item: number;
    codigo_produto: string;
    nome_produto: string;
    quantidade: number;
    valor_unitario: number;
  }[];
  mensagem: string | null;
}

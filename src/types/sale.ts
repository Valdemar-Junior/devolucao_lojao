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
}

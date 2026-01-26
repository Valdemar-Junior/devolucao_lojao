import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface FormBlock1Props {
  filial: string;
  solicitante: string;
  tipoSolicitacao: string;
  tipoDevolucao: string;
  numeroLancamento: string;
  onFilialChange: (value: string) => void;
  onSolicitanteChange: (value: string) => void;
  onTipoSolicitacaoChange: (value: string) => void;
  onTipoDevolucaoChange: (value: string) => void;
  onNumeroLancamentoChange: (value: string) => void;
  onBuscarVenda: () => void;
  isLoading: boolean;
}

export const FormBlock1 = ({
  filial,
  solicitante,
  tipoSolicitacao,
  tipoDevolucao,
  numeroLancamento,
  onFilialChange,
  onSolicitanteChange,
  onTipoSolicitacaoChange,
  onTipoDevolucaoChange,
  onNumeroLancamentoChange,
  onBuscarVenda,
  isLoading,
}: FormBlock1Props) => {
  const tiposSolicitacao = [
    { value: "devolucao_com_credito", label: "Devolução com crédito" },
    { value: "devolucao_sem_credito", label: "Devolução sem crédito" },
    { value: "cancelamento", label: "Cancelamento" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="filial">Filial de venda</Label>
          <Select value={filial} onValueChange={onFilialChange}>
            <SelectTrigger id="filial">
              <SelectValue placeholder="Selecione a filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Loja Assu">Loja Assu</SelectItem>
              <SelectItem value="Loja Mossoró">Loja Mossoró</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="solicitante">Solicitante</Label>
          <Select value={solicitante} onValueChange={onSolicitanteChange}>
            <SelectTrigger id="solicitante">
              <SelectValue placeholder="Selecione o solicitante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="João">João</SelectItem>
              <SelectItem value="Emerson">Emerson</SelectItem>
              <SelectItem value="Thiara">Thiara</SelectItem>
              <SelectItem value="Cristiano">Cristiano</SelectItem>
              <SelectItem value="Junior">Junior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Tipo de solicitação</Label>
        <div className="flex flex-wrap gap-3">
          {tiposSolicitacao.map((tipo) => (
            <button
              key={tipo.value}
              type="button"
              onClick={() => onTipoSolicitacaoChange(tipo.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${tipoSolicitacao === tipo.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      {tipoSolicitacao !== "cancelamento" && (
        <div className="space-y-2">
          <Label htmlFor="tipoDevolucao">Tipo de devolução</Label>
          <Select value={tipoDevolucao} onValueChange={onTipoDevolucaoChange}>
            <SelectTrigger id="tipoDevolucao">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Total">Total</SelectItem>
              <SelectItem value="Parcial">Parcial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="numeroLancamento">Número de lançamento</Label>
        <div className="flex gap-3">
          <Input
            id="numeroLancamento"
            type="text"
            value={numeroLancamento}
            onChange={(e) => onNumeroLancamentoChange(e.target.value)}
            placeholder="Digite o número do lançamento"
            className="flex-1"
          />
          <Button
            onClick={onBuscarVenda}
            disabled={!numeroLancamento || isLoading}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {isLoading ? "Buscando..." : "Buscar venda"}
          </Button>
        </div>
      </div>
    </div>
  );
};

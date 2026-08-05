import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Motivo } from "@/types/sale";

interface FormBlock4Props {
  motivos: Motivo[];
  motivosLoading: boolean;
  motivoId: string;
  onMotivoIdChange: (value: string) => void;
  detalhes: string;
  onDetalhesChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  canSubmit: boolean;
}

export const FormBlock4 = ({
  motivos,
  motivosLoading,
  motivoId,
  onMotivoIdChange,
  detalhes,
  onDetalhesChange,
  onSubmit,
  isLoading,
  canSubmit,
}: FormBlock4Props) => {
  const semMotivos = !motivosLoading && motivos.length === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo da devolução</Label>
        <Select value={motivoId} onValueChange={onMotivoIdChange} disabled={motivosLoading}>
          <SelectTrigger id="motivo" className="w-full">
            <SelectValue
              placeholder={motivosLoading ? "Carregando motivos..." : "Selecione o motivo"}
            />
          </SelectTrigger>
          <SelectContent>
            {motivos.map((motivo) => (
              <SelectItem key={motivo.id} value={String(motivo.id)}>
                {motivo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {semMotivos && (
          <p className="text-sm text-destructive">
            Nenhum motivo cadastrado. Cadastre motivos na tela de Configurações.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="detalhes">Detalhes do motivo</Label>
        <Textarea
          id="detalhes"
          value={detalhes}
          onChange={(e) => onDetalhesChange(e.target.value)}
          placeholder="Descreva por extenso o que aconteceu nesta devolução (ex.: cliente recebeu o produto com defeito, entregador errou o endereço...)"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          Opcional — fica salvo no histórico e aparece no relatório de penalidades.
        </p>
      </div>

      <Button onClick={onSubmit} disabled={!canSubmit || isLoading} size="lg" className="w-full gap-2">
        <Save className="h-4 w-4" />
        {isLoading ? "Salvando..." : "Salvar solicitação"}
      </Button>
    </div>
  );
};

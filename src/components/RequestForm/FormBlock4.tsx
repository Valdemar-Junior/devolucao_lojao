import { useState } from "react";
import { Check, Copy, Save } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
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
  requestPreviewMessage: string;
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
  requestPreviewMessage,
}: FormBlock4Props) => {
  const { toast } = useToast();
  const [copiada, setCopiada] = useState(false);
  const semMotivos = !motivosLoading && motivos.length === 0;

  const copiarMensagem = async () => {
    if (!requestPreviewMessage) {
      toast({
        title: "Nada para copiar",
        description: "Preencha os dados e selecione os itens para gerar a mensagem.",
        variant: "warning",
      });
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(requestPreviewMessage);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = requestPreviewMessage;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
      toast({ title: "Mensagem copiada!", description: "Cole onde precisar." });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

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

      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Prévia da mensagem</p>
            <p className="text-sm text-muted-foreground">
              É o que fica registrado no histórico junto com a solicitação (tela Solicitações).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copiarMensagem}
            className="shrink-0 gap-1.5"
          >
            {copiada ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copiada ? "Copiado!" : "Copiar mensagem"}
          </Button>
        </div>

        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-4 text-sm leading-6 text-foreground">
          {requestPreviewMessage || "Preencha os dados e selecione os itens para visualizar a mensagem final."}
        </pre>
      </div>
    </div>
  );
};

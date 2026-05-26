import { AlertTriangle, Copy, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FormBlock4Props {
  motivoDevolucao: string;
  onMotivoDevolucaoChange: (value: string) => void;
  onSubmit: () => void;
  onCopyMessage: () => void;
  isLoading: boolean;
  canSubmit: boolean;
  requestPreviewMessage: string;
}

export const FormBlock4 = ({
  motivoDevolucao,
  onMotivoDevolucaoChange,
  onSubmit,
  onCopyMessage,
  isLoading,
  canSubmit,
  requestPreviewMessage,
}: FormBlock4Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo da devolução</Label>
        <Textarea
          id="motivo"
          value={motivoDevolucao}
          onChange={(e) => onMotivoDevolucaoChange(e.target.value)}
          placeholder="Descreva o motivo da solicitação de devolução ou cancelamento..."
          className="min-h-32 resize-none"
        />
      </div>

      <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Contingência de envio</AlertTitle>
        <AlertDescription>
          Se esta solicitação não chegar ao grupo, clique em <strong>Copiar mensagem</strong> e
          cole manualmente no WhatsApp. Isso normalmente indica indisponibilidade temporária da
          API do WhatsApp.
        </AlertDescription>
      </Alert>

      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Mensagem que será enviada</p>
            <p className="text-sm text-muted-foreground">
              O texto abaixo pode ser copiado e publicado manualmente no grupo.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={onCopyMessage}
            disabled={!canSubmit}
          >
            <Copy className="h-4 w-4" />
            Copiar mensagem
          </Button>
        </div>

        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-4 text-sm leading-6 text-foreground">
          {requestPreviewMessage || "Preencha os dados e selecione os itens para visualizar a mensagem final."}
        </pre>
      </div>

      <Button onClick={onSubmit} disabled={!canSubmit || isLoading} size="lg" className="w-full gap-2">
        <Send className="h-4 w-4" />
        {isLoading ? "Enviando..." : "Enviar solicitação"}
      </Button>
    </div>
  );
};

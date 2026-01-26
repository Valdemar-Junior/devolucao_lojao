import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface FormBlock4Props {
  motivoDevolucao: string;
  onMotivoDevolucaoChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  canSubmit: boolean;
}

export const FormBlock4 = ({
  motivoDevolucao,
  onMotivoDevolucaoChange,
  onSubmit,
  isLoading,
  canSubmit,
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

      <Button
        onClick={onSubmit}
        disabled={!canSubmit || isLoading}
        size="lg"
        className="w-full gap-2"
      >
        <Send className="w-4 h-4" />
        {isLoading ? "Enviando..." : "Enviar solicitação"}
      </Button>
    </div>
  );
};

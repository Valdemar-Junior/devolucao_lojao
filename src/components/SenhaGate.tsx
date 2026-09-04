import { FormEvent, ReactNode, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Senha das abas protegidas (Penalidades e Configurações).
// Pode ser trocada pelo .env (VITE_PENALIDADES_SENHA).
const SENHA_PADRAO = "6163";
const SENHA = import.meta.env.VITE_PENALIDADES_SENHA || SENHA_PADRAO;

interface SenhaGateProps {
  titulo?: string;
  descricao?: string;
  children: ReactNode;
}

const SenhaGate = ({
  titulo = "Área protegida",
  descricao = "Informe a senha de acesso para visualizar as penalidades.",
  children,
}: SenhaGateProps) => {
  // O desbloqueio não é guardado: o componente é desmontado ao sair da aba,
  // então a senha é exigida a cada entrada (e a cada recarregamento da página).
  const [liberado, setLiberado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  if (liberado) return <>{children}</>;

  const confirmar = (e: FormEvent) => {
    e.preventDefault();
    if (senha.trim() !== SENHA) {
      setErro("Senha incorreta. Tente novamente.");
      setSenha("");
      return;
    }
    setErro("");
    setLiberado(true);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Card className="w-full animate-fade-in-up">
        <CardHeader className="items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_6px_16px_-6px_hsl(357_84%_45%/0.7)]">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle>{titulo}</CardTitle>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={confirmar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-acesso">Senha</Label>
              <Input
                id="senha-acesso"
                type="password"
                inputMode="numeric"
                autoFocus
                autoComplete="current-password"
                placeholder="••••"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (erro) setErro("");
                }}
              />
              {erro && <p className="text-sm text-destructive">{erro}</p>}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!senha.trim()}>
              <KeyRound className="h-4 w-4" />
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SenhaGate;

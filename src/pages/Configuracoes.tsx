import { useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { Filial, Motivo, Solicitante } from "@/types/sale";

function useRegistros<T extends { id: number }>(tabela: string, nomeExibicao: string) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const canceladoRef = useRef(false);

  const carregar = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      toast({
        title: "Erro",
        description: "Supabase não configurado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.from(tabela).select("*").order("id");
      if (error) throw error;
      if (!canceladoRef.current) setItems((data ?? []) as T[]);
    } catch (error) {
      if (!canceladoRef.current) {
        console.error(`Erro ao carregar ${tabela}:`, error);
        toast({
          title: "Erro",
          description: `Não foi possível carregar ${nomeExibicao}.`,
          variant: "destructive",
        });
      }
    } finally {
      if (!canceladoRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    canceladoRef.current = false;
    carregar();
    return () => {
      canceladoRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adicionar = async (nome: string, extras?: Record<string, unknown>) => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      toast({
        title: "Campo obrigatório",
        description: "Digite um nome.",
        variant: "destructive",
      });
      return false;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from(tabela).insert({ nome: nomeLimpo, ...extras });
      if (error) throw error;
      toast({ title: "Adicionado!", description: `"${nomeLimpo}" cadastrado(a).` });
      await carregar();
      return true;
    } catch (error) {
      console.error(`Erro ao adicionar em ${tabela}:`, error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar. Verifique se já não existe.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const toggle = async (item: T, campo: "ativo" | "causa_penalidade") => {
    const atual = (item as unknown as Record<string, boolean>)[campo];
    setItems((lista) =>
      lista.map((i) => (i.id === item.id ? ({ ...i, [campo]: !atual } as T) : i)),
    );

    const { error } = await supabase.from(tabela).update({ [campo]: !atual }).eq("id", item.id);
    if (error) {
      setItems((lista) =>
        lista.map((i) => (i.id === item.id ? ({ ...i, [campo]: atual } as T) : i)),
      );
      toast({
        title: "Erro",
        description: "Não foi possível atualizar.",
        variant: "destructive",
      });
    }
  };

  const editar = async (item: T, novoNome: string) => {
    const nomeLimpo = novoNome.trim();
    const nomeAnterior = (item as unknown as { nome: string }).nome;
    if (!nomeLimpo || nomeLimpo === nomeAnterior) return;

    setItems((lista) =>
      lista.map((i) => (i.id === item.id ? ({ ...i, nome: nomeLimpo } as T) : i)),
    );

    const { error } = await supabase.from(tabela).update({ nome: nomeLimpo }).eq("id", item.id);
    if (error) {
      setItems((lista) =>
        lista.map((i) => (i.id === item.id ? ({ ...i, nome: nomeAnterior } as T) : i)),
      );
      toast({
        title: "Erro",
        description: "Não foi possível renomear. Verifique se o nome já não existe.",
        variant: "destructive",
      });
    }
  };

  return { items, loading, salvando, adicionar, toggle, editar };
}

const LinhaEditavel = ({
  nome,
  aoRenomear,
}: {
  nome: string;
  aoRenomear: (novoNome: string) => void;
}) => {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nome);

  const salvar = () => {
    aoRenomear(valor);
    setEditando(false);
  };

  const cancelar = () => {
    setValor(nome);
    setEditando(false);
  };

  if (editando) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") salvar();
            if (e.key === "Escape") cancelar();
          }}
          className="h-8 flex-1"
          autoFocus
        />
        <Button size="sm" onClick={salvar} className="shrink-0">
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelar} className="shrink-0">
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <p className="min-w-0 truncate font-medium">{nome}</p>
      <button
        type="button"
        onClick={() => {
          setValor(nome);
          setEditando(true);
        }}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Renomear"
        aria-label="Renomear"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
};

const FormAdicionar = ({
  placeholder,
  salvando,
  aoAdicionar,
}: {
  placeholder: string;
  salvando: boolean;
  aoAdicionar: (nome: string) => boolean | Promise<boolean>;
}) => {
  const [nome, setNome] = useState("");

  const confirmar = async () => {
    const ok = await aoAdicionar(nome);
    if (ok) setNome("");
  };

  return (
    <div className="flex gap-3">
      <Input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            confirmar();
          }
        }}
      />
      <Button
        onClick={confirmar}
        disabled={salvando || !nome.trim()}
        className="shrink-0 gap-2"
      >
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </div>
  );
};

const MotivosTab = () => {
  const { items, loading, salvando, adicionar, toggle, editar } = useRegistros<Motivo>(
    "motivos",
    "os motivos",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de devolução</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormAdicionar
          placeholder="Ex: Produto quebrado na entrega"
          salvando={salvando}
          aoAdicionar={(nome) => adicionar(nome, { causa_penalidade: true })}
        />
        <p className="text-sm text-muted-foreground">
          Motivos marcados como <strong>Causa penalidade</strong> contam para a multa do vendedor
          (R$ 30 até a 3ª ocorrência, R$ 50 depois). Desative um motivo para ele sumir do
          formulário sem apagar o histórico.
        </p>
        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <LinhaEditavel nome={m.nome} aoRenomear={(novoNome) => editar(m, novoNome)} />
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={m.causa_penalidade}
                      onCheckedChange={() => toggle(m, "causa_penalidade")}
                    />
                    <span
                      className={
                        m.causa_penalidade ? "font-medium text-destructive" : "text-muted-foreground"
                      }
                    >
                      Causa penalidade
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch checked={m.ativo ?? true} onCheckedChange={() => toggle(m, "ativo")} />
                    Ativo
                  </label>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nenhum motivo cadastrado.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SolicitantesTab = () => {
  const { items, loading, salvando, adicionar, toggle, editar } = useRegistros<Solicitante>(
    "solicitantes",
    "os solicitantes",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormAdicionar
          placeholder="Ex: Maria"
          salvando={salvando}
          aoAdicionar={(nome) => adicionar(nome)}
        />
        <p className="text-sm text-muted-foreground">
          Funcionários que abrem solicitações. Desative para esconder do formulário.
        </p>
        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <LinhaEditavel nome={s.nome} aoRenomear={(novoNome) => editar(s, novoNome)} />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={s.ativo ?? true} onCheckedChange={() => toggle(s, "ativo")} />
                  Ativo
                </label>
              </div>
            ))}
            {items.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nenhum solicitante cadastrado.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FiliaisTab = () => {
  const { items, loading, salvando, adicionar, toggle, editar } = useRegistros<Filial>(
    "filiais",
    "as filiais",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filiais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormAdicionar
          placeholder="Ex: Loja Natal"
          salvando={salvando}
          aoAdicionar={(nome) => adicionar(nome)}
        />
        <p className="text-sm text-muted-foreground">
          Lojas onde as vendas acontecem. Desative para esconder do formulário.
        </p>
        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <LinhaEditavel nome={f.nome} aoRenomear={(novoNome) => editar(f, novoNome)} />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={f.ativo ?? true} onCheckedChange={() => toggle(f, "ativo")} />
                  Ativo
                </label>
              </div>
            ))}
            {items.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma filial cadastrada.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Configuracoes = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Cadastre motivos, solicitantes e filiais usados nos formulários
        </p>
      </div>

      <Tabs defaultValue="motivos">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="motivos">Motivos</TabsTrigger>
          <TabsTrigger value="solicitantes">Solicitantes</TabsTrigger>
          <TabsTrigger value="filiais">Filiais</TabsTrigger>
        </TabsList>
        <TabsContent value="motivos">
          <MotivosTab />
        </TabsContent>
        <TabsContent value="solicitantes">
          <SolicitantesTab />
        </TabsContent>
        <TabsContent value="filiais">
          <FiliaisTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;

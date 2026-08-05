import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Copy,
  Eye,
  FileText,
  Package2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { SolicitacaoDevolucao } from "@/types/sale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatQuantity = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

type FiltroData = "hoje" | "7dias" | "mes" | "mesAnterior" | "personalizado";

const OPCOES_DATA: { id: FiltroData; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "Últimos 7 dias" },
  { id: "mes", label: "Mês atual" },
  { id: "mesAnterior", label: "Mês anterior" },
  { id: "personalizado", label: "Personalizado" },
];

const TIPOS_SOLICITACAO = ["Devolução com crédito", "Devolução sem crédito", "Cancelamento"];

const tipoBadge = (tipo: string) => {
  switch (tipo) {
    case "Devolução com crédito":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Crédito</Badge>
      );
    case "Devolução sem crédito":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Sem crédito</Badge>
      );
    case "Cancelamento":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelamento</Badge>;
    default:
      return <Badge variant="outline">{tipo}</Badge>;
  }
};

const Campo = ({ rotulo, valor }: { rotulo: string; valor?: string | number | null }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
    <p className="mt-0.5 text-sm font-medium text-foreground">
      {valor === null || valor === undefined || valor === "" ? "—" : String(valor)}
    </p>
  </div>
);

const toDateInput = (d: Date) => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const Solicitacoes = () => {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDevolucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");
  const [detalhe, setDetalhe] = useState<SolicitacaoDevolucao | null>(null);
  const canceladoRef = useRef(false);

  // Filtros
  const [filtroData, setFiltroData] = useState<FiltroData>("mes");
  const [periodoDe, setPeriodoDe] = useState("");
  const [periodoAte, setPeriodoAte] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("todos");
  const [filtroMotivo, setFiltroMotivo] = useState("todos");
  const [filtroSolicitante, setFiltroSolicitante] = useState("todos");
  const [filtroFilial, setFiltroFilial] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca] = useState("");

  // Mapas para identificar motivos que causam penalidade
  const [motivosMap, setMotivosMap] = useState<Record<string, boolean>>({});

  const carregar = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setErro("Supabase não configurado. Adicione as credenciais no arquivo .env.");
      return;
    }

    try {
      const [resp, motivosResp] = await Promise.all([
        supabase.from("solicitacoes_devolucao").select("*").order("created_at", { ascending: false }),
        supabase.from("motivos").select("id, nome, causa_penalidade"),
      ]);

      if (resp.error) throw resp.error;
      if (motivosResp.error) throw motivosResp.error;

      if (!canceladoRef.current) {
        setSolicitacoes((resp.data ?? []) as SolicitacaoDevolucao[]);
        const mapa: Record<string, boolean> = {};
        for (const m of (motivosResp.data ?? []) as { id: number; nome: string; causa_penalidade: boolean }[]) {
          mapa[String(m.id)] = m.causa_penalidade;
          mapa[String(m.nome).toLowerCase()] = m.causa_penalidade;
        }
        setMotivosMap(mapa);
        setErro("");
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
      if (!canceladoRef.current) setErro("Não foi possível carregar as solicitações do banco.");
    } finally {
      if (!canceladoRef.current) setLoading(false);
      setRefreshing(false);
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

  const atualizar = () => {
    setRefreshing(true);
    carregar();
  };

  const rangeData = useMemo((): [number, number] | null => {
    const agora = new Date();
    switch (filtroData) {
      case "hoje": {
        const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        return [inicio.getTime(), agora.getTime()];
      }
      case "7dias": {
        const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 6);
        return [inicio.getTime(), agora.getTime()];
      }
      case "mes": {
        const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        return [inicio.getTime(), agora.getTime()];
      }
      case "mesAnterior": {
        const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        const fim = new Date(agora.getFullYear(), agora.getMonth(), 1);
        return [inicio.getTime(), fim.getTime()];
      }
      case "personalizado": {
        if (!periodoDe || !periodoAte) return null;
        const inicio = new Date(`${periodoDe}T00:00:00`).getTime();
        const fim = new Date(`${periodoAte}T23:59:59.999`).getTime();
        return [inicio, fim];
      }
    }
  }, [filtroData, periodoDe, periodoAte]);

  const opcoes = useMemo(() => {
    const unicos = (campo: (s: SolicitacaoDevolucao) => string | null | undefined) =>
      [...new Set(solicitacoes.map((s) => campo(s) ?? "").filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      );
    return {
      vendedores: unicos((s) => s.vendedor),
      motivos: unicos((s) => s.motivo_devolucao),
      solicitantes: unicos((s) => s.solicitante),
      filiais: unicos((s) => s.filial),
    };
  }, [solicitacoes]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return solicitacoes.filter((s) => {
      const t = new Date(s.created_at).getTime();
      if (rangeData && (t < rangeData[0] || t > rangeData[1])) return false;
      if (filtroVendedor !== "todos" && s.vendedor !== filtroVendedor) return false;
      if (filtroMotivo !== "todos" && s.motivo_devolucao !== filtroMotivo) return false;
      if (filtroSolicitante !== "todos" && s.solicitante !== filtroSolicitante) return false;
      if (filtroFilial !== "todos" && s.filial !== filtroFilial) return false;
      if (filtroTipo !== "todos" && s.tipo_solicitacao !== filtroTipo) return false;
      if (q) {
        const alvo = [
          s.nome_cliente,
          s.cpf_cnpj,
          String(s.numero_lancamento),
          s.motivo_devolucao,
          s.vendedor,
          s.filial,
          s.solicitante,
        ]
          .join(" ")
          .toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [solicitacoes, rangeData, filtroVendedor, filtroMotivo, filtroSolicitante, filtroFilial, filtroTipo, busca]);

  const totais = useMemo(
    () => ({
      comCredito: filtrados.filter((s) => s.tipo_solicitacao === "Devolução com crédito").length,
      semCredito: filtrados.filter((s) => s.tipo_solicitacao === "Devolução sem crédito").length,
      cancelamentos: filtrados.filter((s) => s.tipo_solicitacao === "Cancelamento").length,
    }),
    [filtrados],
  );

  const causaPenalidade = (s: SolicitacaoDevolucao) => {
    if (s.motivo_id) {
      const porId = motivosMap[String(s.motivo_id)];
      if (porId !== undefined) return porId;
    }
    if (s.motivo_devolucao) {
      return motivosMap[String(s.motivo_devolucao).toLowerCase()] ?? false;
    }
    return false;
  };

  const limparFiltros = () => {
    setFiltroData("mes");
    setPeriodoDe("");
    setPeriodoAte("");
    setFiltroVendedor("todos");
    setFiltroMotivo("todos");
    setFiltroSolicitante("todos");
    setFiltroFilial("todos");
    setFiltroTipo("todos");
    setBusca("");
  };

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const setarPeriodoPersonalizadoMesAnterior = () => {
    const agora = new Date();
    const primeiro = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const ultimo = new Date(agora.getFullYear(), agora.getMonth(), 0);
    setPeriodoDe(toDateInput(primeiro));
    setPeriodoAte(toDateInput(ultimo));
    setFiltroData("personalizado");
  };

  const entrarPersonalizado = () => {
    if (!periodoDe || !periodoAte) setarPeriodoPersonalizadoMesAnterior();
    else setFiltroData("personalizado");
  };

  const filtrosAtivos =
    filtroVendedor !== "todos" ||
    filtroMotivo !== "todos" ||
    filtroSolicitante !== "todos" ||
    filtroFilial !== "todos" ||
    filtroTipo !== "todos" ||
    busca.trim() !== "" ||
    filtroData !== "mes";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Solicitações</h1>
        <p className="text-muted-foreground">
          Todas as devoluções salvas no banco — sem planilha
        </p>
      </div>

      {/* Filtro por período */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
                {OPCOES_DATA.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={o.id === "personalizado" ? entrarPersonalizado : () => setFiltroData(o.id)}
                    aria-pressed={filtroData === o.id}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      filtroData === o.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {filtrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1.5 text-muted-foreground">
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          {filtroData === "personalizado" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="periodoDe">De</Label>
                <Input
                  id="periodoDe"
                  type="date"
                  value={periodoDe}
                  onChange={(e) => setPeriodoDe(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periodoAte">Até</Label>
                <Input
                  id="periodoAte"
                  type="date"
                  value={periodoAte}
                  onChange={(e) => setPeriodoAte(e.target.value)}
                  className="w-44"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setarPeriodoPersonalizadoMesAnterior}
              >
                Mês anterior
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente, CPF, lançamento..."
                aria-label="Buscar solicitações"
                className="pl-9"
              />
            </div>
            <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vendedores</SelectItem>
                {opcoes.vendedores.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroMotivo} onValueChange={setFiltroMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os motivos</SelectItem>
                {opcoes.motivos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroSolicitante} onValueChange={setFiltroSolicitante}>
              <SelectTrigger>
                <SelectValue placeholder="Solicitante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os solicitantes</SelectItem>
                {opcoes.solicitantes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroFilial} onValueChange={setFiltroFilial}>
              <SelectTrigger>
                <SelectValue placeholder="Filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as filiais</SelectItem>
                {opcoes.filiais.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de solicitação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS_SOLICITACAO.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="py-10 text-center text-muted-foreground">Carregando solicitações...</p>}

      {!loading && erro && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      {!loading && !erro && solicitacoes.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <Package2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-lg font-medium">Nenhuma solicitação ainda</p>
          <p className="mt-1 text-sm">
            As solicitações enviadas pelo formulário aparecem aqui automaticamente.
          </p>
        </div>
      )}

      {!loading && !erro && solicitacoes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  No período
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{filtrados.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Com crédito
                </CardTitle>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">R$</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totais.comCredito}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sem crédito
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">R$</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totais.semCredito}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cancelamentos
                </CardTitle>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">X</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totais.cancelamentos}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>
                Devoluções <span className="font-normal text-muted-foreground">({filtrados.length})</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={atualizar}
                disabled={refreshing}
                className="gap-1.5 self-start"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Lançamento</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-center">Itens</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrados.map((s) => {
                      const penalidade = causaPenalidade(s);
                      return (
                        <TableRow key={s.id} className="group">
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(s.created_at)}
                          </TableCell>
                          <TableCell>{s.filial}</TableCell>
                          <TableCell>{s.solicitante}</TableCell>
                          <TableCell>{tipoBadge(s.tipo_solicitacao)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {s.numero_lancamento}
                          </TableCell>
                          <TableCell className="font-medium">{s.vendedor ?? "—"}</TableCell>
                          <TableCell className="max-w-[160px] truncate" title={s.nome_cliente ?? ""}>
                            {s.nome_cliente ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[180px]">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate" title={s.motivo_devolucao ?? ""}>
                                {s.motivo_devolucao ?? "—"}
                              </span>
                              {penalidade && (
                                <Badge variant="destructive" className="shrink-0 px-1.5 text-[10px]">
                                  multa
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{s.itens?.length ?? 0}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetalhe(s)}
                              className="gap-1.5 text-muted-foreground opacity-80 transition-opacity hover:text-foreground group-hover:opacity-100"
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                          Nenhuma solicitação encontrada com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!detalhe} onOpenChange={(open) => !open && setDetalhe(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {detalhe && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  Solicitação #{detalhe.id}
                  <span className="font-normal text-muted-foreground">
                    · Lançamento {detalhe.numero_lancamento}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Criada em {formatDateTime(detalhe.created_at)} · {detalhe.filial}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Campo rotulo="Solicitante" valor={detalhe.solicitante} />
                <Campo rotulo="Tipo de solicitação" valor={detalhe.tipo_solicitacao} />
                <Campo rotulo="Tipo de devolução" valor={detalhe.tipo_devolucao} />
                <Campo rotulo="Vendedor" valor={detalhe.vendedor} />
                <Campo rotulo="Tipo de operação" valor={detalhe.tipo_operacao} />
                <Campo rotulo="Filial" valor={detalhe.filial} />
                <Campo rotulo="Cliente" valor={detalhe.nome_cliente} />
                <Campo rotulo="CPF/CNPJ" valor={detalhe.cpf_cnpj} />
                <Campo rotulo="Hora no envio" valor={detalhe.data_hora_solicitacao} />
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <Campo rotulo="Motivo" valor={detalhe.motivo_devolucao} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Penalidade
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {causaPenalidade(detalhe) ? (
                      <Badge variant="destructive">Causa penalidade</Badge>
                    ) : (
                      <Badge variant="outline">Sem penalidade</Badge>
                    )}
                  </p>
                </div>
                {detalhe.detalhes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Detalhes do motivo
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                      {detalhe.detalhes}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Itens da devolução ({detalhe.itens?.length ?? 0})</p>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detalhe.itens ?? []).map((item, idx) => (
                        <TableRow key={`${item.sequencia_item}-${idx}`}>
                          <TableCell className="font-medium">{item.nome_produto}</TableCell>
                          <TableCell>{item.codigo_produto}</TableCell>
                          <TableCell className="text-right">{formatQuantity(item.quantidade)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.quantidade * item.valor_unitario)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(detalhe.itens ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-4 text-center text-muted-foreground">
                            Sem itens registrados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {detalhe.mensagem && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Mensagem registrada na solicitação</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copiar(detalhe.mensagem ?? "")}
                      className="gap-1.5"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-4 text-sm leading-6 text-foreground">
                    {detalhe.mensagem}
                  </pre>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setDetalhe(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Solicitacoes;

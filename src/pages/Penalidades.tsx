import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  DollarSign,
  FileDown,
  Gavel,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import {
  Filial,
  Motivo,
  OcorrenciaVendedor,
  PenalidadeVendedor,
  Solicitante,
  Vendedor,
} from "@/types/sale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// Webhook do n8n responsável pelo envio do relatório por e-mail (fluxo ativo).
const WEBHOOK_EMAIL_URL = "/api-n8n/webhook/penalidades";

const Penalidades = () => {
  const { toast } = useToast();
  const [resumo, setResumo] = useState<PenalidadeVendedor[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaVendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [modoDialog, setModoDialog] = useState<"pdf" | "email">("email");
  const [periodoDe, setPeriodoDe] = useState("");
  const [periodoAte, setPeriodoAte] = useState("");
  const [dialogAvulsaAberto, setDialogAvulsaAberto] = useState(false);
  const [avulsaFilial, setAvulsaFilial] = useState("");
  const [avulsaSolicitante, setAvulsaSolicitante] = useState("");
  const [avulsaVendedor, setAvulsaVendedor] = useState("");
  const [avulsaLancamento, setAvulsaLancamento] = useState("");
  const [avulsaMotivoId, setAvulsaMotivoId] = useState("");
  const [avulsaDetalhes, setAvulsaDetalhes] = useState("");
  const [opcoesFiliais, setOpcoesFiliais] = useState<Filial[]>([]);
  const [opcoesSolicitantes, setOpcoesSolicitantes] = useState<Solicitante[]>([]);
  const [opcoesMotivos, setOpcoesMotivos] = useState<Motivo[]>([]);
  const [opcoesVendedores, setOpcoesVendedores] = useState<Vendedor[]>([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  const [erroOpcoes, setErroOpcoes] = useState(false);
  const [salvandoAvulsa, setSalvandoAvulsa] = useState(false);
  const canceladoRef = useRef(false);

  const carregar = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setErro("Supabase não configurado. Adicione as credenciais no arquivo .env.");
      return;
    }

    try {
      const [resumoResp, ocorrenciasResp] = await Promise.all([
        supabase
          .from("vw_penalidades_vendedores")
          .select("*")
          .order("valor_penalidade", { ascending: false }),
        supabase
          .from("vw_ocorrencias_vendedor")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (resumoResp.error) throw resumoResp.error;
      if (ocorrenciasResp.error) throw ocorrenciasResp.error;

      if (!canceladoRef.current) {
        setResumo((resumoResp.data ?? []) as PenalidadeVendedor[]);
        setOcorrencias((ocorrenciasResp.data ?? []) as OcorrenciaVendedor[]);
        setErro("");
      }
    } catch (error) {
      console.error("Erro ao carregar vendedores:", error);
      if (!canceladoRef.current) setErro("Não foi possível carregar os dados de penalidades.");
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

  const abrirDialogAvulsa = async () => {
    setDialogAvulsaAberto(true);
    setCarregandoOpcoes(true);
    setErroOpcoes(false);
    try {
      const [filiaisResp, solicitantesResp, motivosResp, vendedoresResp] = await Promise.all([
        supabase.from("filiais").select("id, nome").eq("ativo", true).order("nome"),
        supabase.from("solicitantes").select("id, nome").eq("ativo", true).order("nome"),
        supabase
          .from("motivos")
          .select("id, nome, causa_penalidade")
          .eq("ativo", true)
          .eq("causa_penalidade", true)
          .order("nome"),
        supabase.from("vendedores").select("id, nome").eq("ativo", true).order("nome"),
      ]);
      if (filiaisResp.error) throw filiaisResp.error;
      if (solicitantesResp.error) throw solicitantesResp.error;
      if (motivosResp.error) throw motivosResp.error;
      if (vendedoresResp.error) throw vendedoresResp.error;
      setOpcoesFiliais((filiaisResp.data ?? []) as Filial[]);
      setOpcoesSolicitantes((solicitantesResp.data ?? []) as Solicitante[]);
      setOpcoesMotivos((motivosResp.data ?? []) as Motivo[]);
      setOpcoesVendedores((vendedoresResp.data ?? []) as Vendedor[]);
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
      setErroOpcoes(true);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as opções do formulário.",
        variant: "destructive",
      });
    } finally {
      setCarregandoOpcoes(false);
    }
  };

  const fecharDialogAvulsa = () => {
    if (salvandoAvulsa) return;
    setDialogAvulsaAberto(false);
    setAvulsaFilial("");
    setAvulsaSolicitante("");
    setAvulsaVendedor("");
    setAvulsaLancamento("");
    setAvulsaMotivoId("");
    setAvulsaDetalhes("");
  };

  const registrarAvulsa = async () => {
    if (
      !avulsaFilial ||
      !avulsaSolicitante ||
      !avulsaVendedor ||
      !avulsaMotivoId ||
      !avulsaLancamento.trim() ||
      !Number.isFinite(Number(avulsaLancamento))
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha filial, solicitante, vendedor, nº de lançamento e motivo.",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Supabase não configurado",
        description: "Adicione as credenciais no .env para salvar a penalidade.",
        variant: "destructive",
      });
      return;
    }

    const motivo = opcoesMotivos.find((m) => String(m.id) === avulsaMotivoId);
    const dataHora = new Date().toLocaleString("pt-BR", { hour12: false });
    const numeroLancamento =
      avulsaLancamento.trim() && Number.isFinite(Number(avulsaLancamento))
        ? Number(avulsaLancamento)
        : 0;
    const mensagem = [
      "⚠️ Penalidade Avulsa - Lojão dos Móveis",
      "",
      `⏰ Data e Hora: ${dataHora}`,
      "",
      `📍 Filial: ${avulsaFilial}`,
      `👤 Solicitante: ${avulsaSolicitante}`,
      `🧑‍💼 Vendedor: ${avulsaVendedor}`,
      `🧾 Nº Lançamento: ${numeroLancamento > 0 ? numeroLancamento : "—"}`,
      `✍️ Motivo: ${motivo?.nome ?? ""}`,
      avulsaDetalhes.trim() ? `📝 Detalhes: ${avulsaDetalhes.trim()}` : null,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");

    setSalvandoAvulsa(true);
    try {
      const { error } = await supabase.from("solicitacoes_devolucao").insert({
        filial: avulsaFilial,
        solicitante: avulsaSolicitante,
        tipo_solicitacao: "Penalidade avulsa",
        tipo_devolucao: "Avulsa",
        numero_lancamento: numeroLancamento,
        tipo_operacao: null,
        nome_cliente: null,
        cpf_cnpj: null,
        vendedor: avulsaVendedor,
        data_hora_solicitacao: dataHora,
        motivo_id: Number(avulsaMotivoId),
        motivo_devolucao: motivo?.nome ?? null,
        detalhes: avulsaDetalhes.trim() || null,
        itens: [],
        mensagem,
      });
      if (error) throw error;

      toast({
        title: "Penalidade registrada!",
        description: `Ocorrência registrada para ${avulsaVendedor} — já conta na contagem de multas.`,
      });
      fecharDialogAvulsa();
      carregar();
    } catch (error) {
      console.error("Erro ao registrar penalidade avulsa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a penalidade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvandoAvulsa(false);
    }
  };

  const totalErros = resumo.reduce((soma, v) => soma + (v.total_erros ?? 0), 0);
  const totalMultas = resumo.reduce((soma, v) => soma + (v.valor_penalidade ?? 0), 0);
  const vendedoresLista = [...new Set(ocorrencias.map((o) => o.vendedor))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const ocorrenciasFiltradas =
    filtro === "todos" ? ocorrencias : ocorrencias.filter((o) => o.vendedor === filtro);

  const hoje = new Date();

  const toDateInput = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const setarMesAnterior = () => {
    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    setPeriodoDe(toDateInput(primeiro));
    setPeriodoAte(toDateInput(ultimo));
  };

  const setarMesAtual = () => {
    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setPeriodoDe(toDateInput(primeiro));
    setPeriodoAte(toDateInput(hoje));
  };

  const formatPeriodo = (de: string, ate: string) => {
    const d = new Date(`${de}T12:00:00`);
    const a = new Date(`${ate}T12:00:00`);
    return `${d.toLocaleDateString("pt-BR")} a ${a.toLocaleDateString("pt-BR")}`;
  };

  const ocorrenciasDoPeriodo = (de: string, ate: string) => {
    const inicio = new Date(`${de}T00:00:00`).getTime();
    const fim = new Date(`${ate}T23:59:59.999`).getTime();
    return ocorrencias.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= inicio && t <= fim;
    });
  };

  const resumoDeOcorrencias = (lista: OcorrenciaVendedor[]): PenalidadeVendedor[] => {
    const mapa = new Map<
      string,
      { erros30: number; erros50: number; total: number; valor: number }
    >();
    for (const o of lista) {
      const atual = mapa.get(o.vendedor) ?? { erros30: 0, erros50: 0, total: 0, valor: 0 };
      atual.total += 1;
      if (o.multa <= 30) atual.erros30 += 1;
      else atual.erros50 += 1;
      atual.valor += o.multa;
      mapa.set(o.vendedor, atual);
    }
    return [...mapa.entries()]
      .map(([vendedor, r]) => ({
        vendedor,
        total_erros: r.total,
        erros_taxa_30: r.erros30,
        erros_taxa_50: r.erros50,
        valor_penalidade: r.valor,
      }))
      .sort((a, b) => b.valor_penalidade - a.valor_penalidade);
  };

  const montarPDF = (
    resumoDados: PenalidadeVendedor[],
    ocorrenciasDados: OcorrenciaVendedor[],
    periodoTexto?: string,
  ) => {
    const doc = new jsPDF();
    const geradoEm = new Date().toLocaleString("pt-BR", { hour12: false });
    const totalErrosD = resumoDados.reduce((soma, v) => soma + (v.total_erros ?? 0), 0);
    const totalMultasD = resumoDados.reduce((soma, v) => soma + (v.valor_penalidade ?? 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Lojão dos Móveis", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Relatório de Penalidades por Vendedor", 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(120);
    let y = 32;
    if (periodoTexto) {
      doc.text(`Período: ${periodoTexto}`, 14, y);
      y += 6;
    }
    doc.text(`Gerado em: ${geradoEm}`, 14, y);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: y + 8,
      head: [["Vendedor", "Erros a R$ 30", "Erros a R$ 50", "Total de erros", "Valor da penalidade"]],
      body: resumoDados.map((v) => [
        v.vendedor,
        String(v.erros_taxa_30 ?? 0),
        String(v.erros_taxa_50 ?? 0),
        String(v.total_erros ?? 0),
        formatCurrency(v.valor_penalidade),
      ]),
      headStyles: { fillColor: [21, 128, 61] as [number, number, number] },
      styles: { fontSize: 9 },
    });

    const resumoY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Vendedores com multa: ${resumoDados.length}`, 14, resumoY);
    doc.text(`Total de erros: ${totalErrosD}`, 14, resumoY + 6);
    doc.text(`Total em multas: ${formatCurrency(totalMultasD)}`, 14, resumoY + 12);
    doc.setFont("helvetica", "normal");

    autoTable(doc, {
      startY: resumoY + 18,
      head: [["Data", "Vendedor", "Motivo", "Detalhes", "Lançamento", "Filial", "Ocorrência", "Multa"]],
      body: ocorrenciasDados.map((o) => [
        formatDate(o.created_at),
        o.tipo_solicitacao === "Penalidade avulsa" ? `${o.vendedor} (avulsa)` : o.vendedor,
        o.motivo,
        o.detalhes ?? "",
        o.numero_lancamento > 0 ? String(o.numero_lancamento) : "—",
        o.filial,
        `${o.n}ª`,
        formatCurrency(o.multa),
      ]),
      headStyles: { fillColor: [21, 128, 61] as [number, number, number] },
      styles: { fontSize: 8 },
      columnStyles: { 3: { cellWidth: 70 } },
    });

    return doc;
  };

  const abrirDialogPDF = () => {
    setModoDialog("pdf");
    setarMesAnterior();
    setDialogAberto(true);
  };

  const abrirDialogEmail = () => {
    setModoDialog("email");
    setarMesAnterior();
    setDialogAberto(true);
  };

  const confirmarPeriodo = async () => {
    if (!periodoDe || !periodoAte) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o período (de / até).",
        variant: "destructive",
      });
      return;
    }
    if (new Date(periodoDe) > new Date(periodoAte)) {
      toast({
        title: "Período inválido",
        description: "A data inicial não pode ser depois da data final.",
        variant: "destructive",
      });
      return;
    }

    const lista = ocorrenciasDoPeriodo(periodoDe, periodoAte);
    const resumoPeriodo = resumoDeOcorrencias(lista);
    const periodoTexto = formatPeriodo(periodoDe, periodoAte);

    if (lista.length === 0) {
      toast({
        title: "Nenhuma ocorrência",
        description: `Não há ocorrências no período de ${periodoTexto}.`,
        variant: "warning",
      });
      return;
    }

    setDialogAberto(false);

    if (modoDialog === "pdf") {
      try {
        montarPDF(resumoPeriodo, lista, periodoTexto).save("relatorio-penalidades.pdf");
        toast({
          title: "PDF gerado!",
          description: `Relatório do período ${periodoTexto} baixado.`,
        });
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar o PDF.",
          variant: "destructive",
        });
      }
      return;
    }

    setEnviandoEmail(true);
    try {
      // jsPDF v4: output("base64") retorna null; usamos datauristring e extraímos o base64 puro
      const pdfBase64 = montarPDF(resumoPeriodo, lista, periodoTexto)
        .output("datauristring")
        .split(",")[1];
      const totalErrosPeriodo = resumoPeriodo.reduce((soma, v) => soma + v.total_erros, 0);
      const totalMultasPeriodo = resumoPeriodo.reduce(
        (soma, v) => soma + v.valor_penalidade,
        0,
      );
      const corpo = [
        `Segue anexo relatório de penalidades referente ao período de ${periodoTexto}.`,
        "",
        `Total de erros: ${totalErrosPeriodo}`,
        `Total em multas: ${formatCurrency(totalMultasPeriodo)}`,
      ].join("\n");

      const resp = await fetch(WEBHOOK_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto: `Relatório de Penalidades - Período ${periodoTexto}`,
          corpo,
          pdf_base64: pdfBase64,
        }),
      });
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      toast({
        title: "E-mail enviado!",
        description: `Relatório do período ${periodoTexto} enviado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro",
        description: `Não foi possível enviar o e-mail (${(error as Error).message}). Verifique o webhook no n8n.`,
        variant: "destructive",
      });
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Penalidades</h1>
          <p className="text-muted-foreground">
            Ocorrências de devolução com penalidade por vendedor
          </p>
        </div>

        {!loading && !erro && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={abrirDialogAvulsa} className="gap-2">
                <Gavel className="h-4 w-4" />
                Registrar penalidade avulsa
              </Button>
              {(resumo.length > 0 || ocorrencias.length > 0) && (
                <>
                  <Button onClick={abrirDialogPDF} variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Gerar PDF
                  </Button>
                  <Button onClick={abrirDialogEmail} variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Enviar por e-mail
                  </Button>
                </>
              )}
            </div>
            {(resumo.length > 0 || ocorrencias.length > 0) && (
              <p className="text-xs text-muted-foreground">
                O e-mail é disparado pelo webhook do n8n. O PDF vai anexado automaticamente.
              </p>
            )}
          </div>
        )}
      </div>

      {loading && <p className="py-10 text-center text-muted-foreground">Carregando dados...</p>}

      {!loading && erro && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      {!loading && !erro && resumo.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma ocorrência ainda</p>
          <p className="mt-1 text-sm">
            As penalidades aparecem aqui quando uma solicitação de devolução é enviada com um
            motivo que causa penalidade, ou quando você registra uma{" "}
            <button
              type="button"
              onClick={abrirDialogAvulsa}
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              penalidade avulsa
            </button>
            .
          </p>
        </div>
      )}

      {!loading && !erro && (resumo.length > 0 || ocorrencias.length > 0) && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vendedores com multa
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{resumo.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de erros
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalErros}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total em multas
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive">
                  {formatCurrency(totalMultas)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo por vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Erros a R$ 30</TableHead>
                    <TableHead className="text-right">Erros a R$ 50</TableHead>
                    <TableHead className="text-right">Total de erros</TableHead>
                    <TableHead className="text-right">Valor da penalidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumo.map((v) => (
                    <TableRow key={v.vendedor}>
                      <TableCell className="font-medium">{v.vendedor}</TableCell>
                      <TableCell className="text-right">{v.erros_taxa_30 ?? 0}</TableCell>
                      <TableCell className="text-right">{v.erros_taxa_50 ?? 0}</TableCell>
                      <TableCell className="text-right">{v.total_erros ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(v.valor_penalidade)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Ocorrências</CardTitle>
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filtrar por vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os vendedores</SelectItem>
                  {vendedoresLista.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="text-right">Lançamento</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead className="text-right">Ocorrência</TableHead>
                    <TableHead className="text-right">Multa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ocorrenciasFiltradas.map((o) => (
                    <TableRow key={o.solicitacao_id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          {o.vendedor}
                          {o.tipo_solicitacao === "Penalidade avulsa" && (
                            <Badge className="shrink-0 bg-violet-100 px-1.5 text-[10px] text-violet-800 hover:bg-violet-100">
                              Avulsa
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{o.motivo}</TableCell>
                      <TableCell className="max-w-[240px]">
                        {o.detalhes ? (
                          <span className="line-clamp-2 text-sm" title={o.detalhes}>
                            {o.detalhes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.numero_lancamento > 0 ? o.numero_lancamento : "—"}
                      </TableCell>
                      <TableCell>{o.filial}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{o.n}ª</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(o.multa)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ocorrenciasFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Nenhuma ocorrência para este filtro.
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

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modoDialog === "email" ? "Enviar relatório por e-mail" : "Gerar relatório em PDF"}
            </DialogTitle>
            <DialogDescription>
              Escolha o período do relatório. Por padrão já vem o mês anterior.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodoDe">De</Label>
              <Input
                id="periodoDe"
                type="date"
                value={periodoDe}
                onChange={(e) => setPeriodoDe(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodoAte">Até</Label>
              <Input
                id="periodoAte"
                type="date"
                value={periodoAte}
                onChange={(e) => setPeriodoAte(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setarMesAnterior}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Mês anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setarMesAtual}
              className="gap-2"
            >
              Este mês
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPeriodo} disabled={enviandoEmail} className="gap-2">
              {modoDialog === "email" ? (
                <>
                  <Mail className="h-4 w-4" />
                  {enviandoEmail ? "Enviando..." : "Enviar e-mail"}
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Gerar PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAvulsaAberto} onOpenChange={(open) => !open && fecharDialogAvulsa()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Registrar penalidade avulsa
            </DialogTitle>
            <DialogDescription>
              Para casos em que não há devolução, mas a penalidade precisa ser registrada. O valor
              segue a regra automática: R$ 30 nas 3 primeiras ocorrências e R$ 50 da 4ª em diante.
            </DialogDescription>
          </DialogHeader>

          {carregandoOpcoes ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando opções...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="avulsaFilial">Filial</Label>
                <Select value={avulsaFilial} onValueChange={setAvulsaFilial}>
                  <SelectTrigger id="avulsaFilial">
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesFiliais.map((f) => (
                      <SelectItem key={f.id} value={f.nome}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avulsaSolicitante">Solicitante</Label>
                <Select value={avulsaSolicitante} onValueChange={setAvulsaSolicitante}>
                  <SelectTrigger id="avulsaSolicitante">
                    <SelectValue placeholder="Selecione o solicitante" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesSolicitantes.map((s) => (
                      <SelectItem key={s.id} value={s.nome}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avulsaVendedor">Vendedor</Label>
                <Select value={avulsaVendedor} onValueChange={setAvulsaVendedor}>
                  <SelectTrigger id="avulsaVendedor">
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesVendedores.map((v) => (
                      <SelectItem key={v.id} value={v.nome}>
                        {v.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avulsaMotivo">Motivo</Label>
                <Select value={avulsaMotivoId} onValueChange={setAvulsaMotivoId}>
                  <SelectTrigger id="avulsaMotivo">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesMotivos.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avulsaLancamento">Nº Lançamento</Label>
                <Input
                  id="avulsaLancamento"
                  type="number"
                  inputMode="numeric"
                  value={avulsaLancamento}
                  onChange={(e) => setAvulsaLancamento(e.target.value)}
                  placeholder="Ex: 143404"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="avulsaDetalhes">Detalhes</Label>
                <Textarea
                  id="avulsaDetalhes"
                  value={avulsaDetalhes}
                  onChange={(e) => setAvulsaDetalhes(e.target.value)}
                  placeholder="Descreva o que aconteceu (opcional)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {!carregandoOpcoes && !erroOpcoes && opcoesMotivos.length === 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              Nenhum motivo ativo com "Causa penalidade" encontrado. Cadastre um em{" "}
              <strong>Configurações → Motivos</strong> antes de registrar.
            </p>
          )}

          {!carregandoOpcoes && !erroOpcoes && opcoesVendedores.length === 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              Nenhum vendedor cadastrado. Adicione os vendedores em{" "}
              <strong>Configurações → Vendedores</strong> (com o mesmo nome do sistema) antes de
              registrar.
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={fecharDialogAvulsa} disabled={salvandoAvulsa}>
              Cancelar
            </Button>
            <Button onClick={registrarAvulsa} disabled={salvandoAvulsa} className="gap-2">
              <Gavel className="h-4 w-4" />
              {salvandoAvulsa ? "Salvando..." : "Registrar penalidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Penalidades;

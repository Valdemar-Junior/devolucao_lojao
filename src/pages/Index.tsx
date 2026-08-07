import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
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
import { FormBlock1 } from "@/components/RequestForm/FormBlock1";
import { FormBlock2 } from "@/components/RequestForm/FormBlock2";
import { FormBlock3 } from "@/components/RequestForm/FormBlock3";
import { FormBlock4 } from "@/components/RequestForm/FormBlock4";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { Motivo, ReturnRequest, Sale } from "@/types/sale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatQuantity = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

const getTipoSolicitacaoLabel = (tipoSolicitacao: string) =>
  tipoSolicitacao === "devolucao_com_credito"
    ? "Devolução com crédito"
    : tipoSolicitacao === "devolucao_sem_credito"
      ? "Devolução sem crédito"
      : "Cancelamento";

const buildRequestMessage = (requestData: ReturnRequest) => {
  const itemsText = requestData.itens_selecionados
    .map((item, index) => {
      const total = item.quantidade * item.valor_unitario;

      return [
        `Item ${index + 1}`,
        `Produto: ${item.nome_produto}`,
        `Código: ${item.codigo_produto}`,
        `Quantidade: ${formatQuantity(item.quantidade)}`,
        `Valor unitário: ${formatCurrency(item.valor_unitario)}`,
        `Total: ${formatCurrency(total)}`,
      ].join("\n");
    })
    .join("\n\n");

  const linhas = [
    "📝 Solicitação de Devolução/Cancelamento - Lojão dos Móveis",
    "",
    `⏰ Data e Hora: ${requestData.data_hora_solicitacao ?? ""}`,
    "",
    `📍 Filial: ${requestData.filial}`,
    `👤 Solicitante: ${requestData.solicitante}`,
    `🔁 Tipo de Devolução: ${requestData.tipo_devolucao}`,
    `🔄 Tipo de Solicitação: ${requestData.tipo_solicitacao}`,
    `🧾 Nº Lançamento: ${requestData.numero_lancamento}`,
    `🚚 Tipo de Operação: ${requestData.tipo_operacao}`,
    `🧑‍💼 Vendedor: ${requestData.vendedor || "Não informado"}`,
    "",
    `👥 Cliente: ${requestData.nome_cliente}`,
    `🆔 CPF/CNPJ: ${requestData.cpf_cnpj}`,
    "",
    "📦 Item(s) da Devolução:",
    "",
    itemsText,
    "",
    `✍️ Motivo: ${requestData.motivo_devolucao}`,
  ];

  if (requestData.detalhes) {
    linhas.push(`📝 Detalhes: ${requestData.detalhes}`);
  }

  return linhas.join("\n");
};

const Index = () => {
  const { toast } = useToast();
  const [filial, setFilial] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [tipoSolicitacao, setTipoSolicitacao] = useState("");
  const [tipoDevolucao, setTipoDevolucao] = useState("");
  const [numeroLancamento, setNumeroLancamento] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [motivoId, setMotivoId] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [motivosLoading, setMotivosLoading] = useState(true);
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSalvoAberto, setModalSalvoAberto] = useState(false);
  const [mensagemSalva, setMensagemSalva] = useState("");
  const [copiadaSalva, setCopiadaSalva] = useState(false);

  const resolveVendor = (obj: Record<string, unknown> | null | undefined) => {
    const keys = ["vendedor", "VENDEDOR", "Vendedor", "nome_vendedor", "NOME_VENDEDOR", "seller"];

    for (const key of keys) {
      const value = obj?.[key];
      if (value) {
        return String(value);
      }
    }

    return "";
  };

  useEffect(() => {
    if (tipoSolicitacao !== "cancelamento" && tipoDevolucao === "Parcial") {
      setSelectedItems([]);
      setReturnQuantities({});
    }
  }, [tipoDevolucao, tipoSolicitacao]);

  useEffect(() => {
    let cancelado = false;

    const carregarMotivos = async () => {
      if (!isSupabaseConfigured) {
        setMotivosLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("motivos")
          .select("id, nome, causa_penalidade, ativo")
          .eq("ativo", true)
          .order("nome");
        if (error) throw error;
        if (!cancelado) setMotivos((data ?? []) as Motivo[]);
      } catch (error) {
        console.error("Erro ao carregar motivos:", error);
      } finally {
        if (!cancelado) setMotivosLoading(false);
      }
    };

    carregarMotivos();
    return () => {
      cancelado = true;
    };
  }, []);

  const tipoSolicitacaoLabel = getTipoSolicitacaoLabel(tipoSolicitacao);
  const motivoSelecionado = motivos.find((motivo) => String(motivo.id) === motivoId);
  const motivoDevolucao = motivoSelecionado?.nome ?? "";

  const requestPreviewData: ReturnRequest | null = sale
    ? {
        filial,
        solicitante,
        tipo_solicitacao: tipoSolicitacaoLabel,
        tipo_devolucao: tipoSolicitacao === "cancelamento" ? "Total" : tipoDevolucao,
        numero_lancamento: sale.numero_lancamento,
        tipo_operacao: sale.tipo_operacao,
        nome_cliente: sale.nome_cliente,
        cpf_cnpj: sale.cpf_cnpj,
        vendedor: sale.vendedor,
        data_hora_solicitacao: new Date().toLocaleString("pt-BR", { hour12: false }),
        itens_selecionados: sale.itens_vendidos
          .filter((item) => selectedItems.includes(item.sequencia_item))
          .map((item) => ({
            sequencia_item: item.sequencia_item,
            codigo_produto: item.codigo_produto,
            nome_produto: item.nome_produto,
            quantidade:
              tipoSolicitacao === "cancelamento" || tipoDevolucao === "Total"
                ? item.quantidade_vendida
                : Math.min(
                    Math.max(returnQuantities[item.sequencia_item] || 1, 1),
                    item.quantidade_vendida
                  ),
            valor_unitario: item.valor_unitario,
          })),
        motivo_devolucao: motivoDevolucao,
        detalhes: detalhes.trim() || undefined,
      }
    : null;

  const requestPreviewMessage = requestPreviewData ? buildRequestMessage(requestPreviewData) : "";

  const handleBuscarVenda = async () => {
    if (!numeroLancamento) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número de lançamento",
        variant: "destructive",
      });
      return;
    }

    if (!filial) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a filial",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSale(true);
    try {
      console.log("Buscando venda:", { numeroLancamento, filial });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const resp = await fetch("/api-n8n/webhook/devolucao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_lancamento: numeroLancamento,
          filial,
        }),
        mode: "cors",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || `Erro ${resp.status}`);
      }

      const text = await resp.text();
      if (!text) {
        throw new Error("O n8n retornou uma resposta vazia.");
      }

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("A resposta do n8n não é um JSON válido.");
      }

      if (Array.isArray(data) && data.length > 0) {
        const venda = data[0] as Sale;
        const normalized = { ...venda, vendedor: resolveVendor(data[0]) };
        setSale(normalized as Sale);
        setSelectedItems([]);
        setReturnQuantities({});
        toast({
          title: "Venda encontrada",
          description: `Venda ${venda.numero_lancamento} carregada com sucesso`,
        });
      } else if (data && typeof data === "object" && ("numero_lancamento" in data || "itens_vendidos" in data)) {
        const venda = data as Sale;
        const normalized = { ...venda, vendedor: resolveVendor(data) };
        setSale(normalized as Sale);
        setSelectedItems([]);
        setReturnQuantities({});
        toast({
          title: "Venda encontrada",
          description: `Venda ${venda.numero_lancamento} carregada com sucesso`,
        });
      } else {
        throw new Error("A resposta não contém dados de venda válidos.");
      }
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      const msg = (error as Error)?.message || "";
      const inactiveTest = msg.toLowerCase().includes("not registered");
      const wrongMethod = msg.toLowerCase().includes("not registered for get");

      toast({
        title: "Erro",
        description: inactiveTest
          ? "Webhook não está ativo/registrado no n8n. Verifique se o fluxo está marcado como Active."
          : wrongMethod
            ? "O webhook aceita apenas POST. Ajuste a chamada para POST."
            : "Não foi possível carregar os dados da venda. Verifique o número de lançamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSale(false);
    }
  };

  const copiarMensagemSalva = async () => {
    if (!mensagemSalva) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(mensagemSalva);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = mensagemSalva;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiadaSalva(true);
      setTimeout(() => setCopiadaSalva(false), 2000);
      toast({ title: "Mensagem copiada!", description: "Cole onde precisar." });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleSalvar = async () => {
    if (!sale) {
      toast({
        title: "Erro",
        description: "Carregue uma venda antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione ao menos um item para devolução",
        variant: "destructive",
      });
      return;
    }

    if (!motivoId) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione o motivo da devolução",
        variant: "destructive",
      });
      return;
    }

    const submitTipoSolicitacaoLabel = getTipoSolicitacaoLabel(tipoSolicitacao);
    const requestData = requestPreviewData
      ? {
          ...requestPreviewData,
          tipo_solicitacao: submitTipoSolicitacaoLabel,
        }
      : null;

    if (!requestData) {
      toast({
        title: "Erro",
        description: "Não foi possível montar a solicitação para envio.",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Supabase não configurado",
        description: "Adicione as credenciais no .env para salvar a solicitação.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("solicitacoes_devolucao").insert({
        filial: requestData.filial,
        solicitante: requestData.solicitante,
        tipo_solicitacao: requestData.tipo_solicitacao,
        tipo_devolucao: requestData.tipo_devolucao,
        numero_lancamento: requestData.numero_lancamento,
        tipo_operacao: requestData.tipo_operacao,
        nome_cliente: requestData.nome_cliente,
        cpf_cnpj: requestData.cpf_cnpj,
        vendedor: requestData.vendedor || null,
        data_hora_solicitacao: requestData.data_hora_solicitacao,
        motivo_devolucao: requestData.motivo_devolucao,
        motivo_id: Number(motivoId),
        detalhes: requestData.detalhes || null,
        itens: requestData.itens_selecionados,
        mensagem: requestPreviewMessage,
      });
      if (error) throw error;

      toast({
        title: "Solicitação salva!",
        description: "Registro salvo no histórico — veja na tela Solicitações.",
      });

      setMensagemSalva(requestPreviewMessage);
      setModalSalvoAberto(true);

      setFilial("");
      setSolicitante("");
      setTipoSolicitacao("");
      setTipoDevolucao("");
      setNumeroLancamento("");
      setSale(null);
      setSelectedItems([]);
      setReturnQuantities({});
      setMotivoId("");
      setDetalhes("");
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        title: "Erro",
        description:
          "Não foi possível salvar a solicitação no banco. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(sale) && selectedItems.length > 0 && motivoId !== "";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="animate-fade-in-up space-y-2 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Nova Solicitação de{" "}
            <span className="gradient-text">Devolução / Cancelamento</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            Registre devoluções, cancelamentos e penalidades — tudo salvo direto no banco do
            Lojão dos Móveis.
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-red-50/60 to-amber-50/40">
            <CardTitle>Dados da Solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <FormBlock1
              filial={filial}
              solicitante={solicitante}
              tipoSolicitacao={tipoSolicitacao}
              tipoDevolucao={tipoDevolucao}
              numeroLancamento={numeroLancamento}
              onFilialChange={setFilial}
              onSolicitanteChange={setSolicitante}
              onTipoSolicitacaoChange={setTipoSolicitacao}
              onTipoDevolucaoChange={setTipoDevolucao}
              onNumeroLancamentoChange={setNumeroLancamento}
              onBuscarVenda={handleBuscarVenda}
              isLoading={isLoadingSale}
            />
          </CardContent>
        </Card>

        <FormBlock2 sale={sale} />

        {sale && (
          <>
            <FormBlock3
              sale={sale}
              tipoDevolucao={tipoDevolucao}
              tipoSolicitacao={tipoSolicitacao}
              selectedItems={selectedItems}
              onSelectedItemsChange={setSelectedItems}
              returnQuantities={returnQuantities}
              onReturnQuantityChange={(seq, qty) =>
                setReturnQuantities((prev) => ({ ...prev, [seq]: qty }))
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Finalizar Solicitação</CardTitle>
              </CardHeader>
              <CardContent>
                <FormBlock4
                  motivos={motivos}
                  motivosLoading={motivosLoading}
                  motivoId={motivoId}
                  onMotivoIdChange={setMotivoId}
                  detalhes={detalhes}
                  onDetalhesChange={setDetalhes}
                  onSubmit={handleSalvar}
                  isLoading={isSubmitting}
                  canSubmit={canSubmit}
                />
              </CardContent>
            </Card>
          </>
        )}

      <Dialog open={modalSalvoAberto} onOpenChange={(open) => !open && setModalSalvoAberto(false)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Solicitação salva no banco!
            </DialogTitle>
            <DialogDescription>
              O registro foi salvo no histórico (tela Solicitações). Copie a mensagem abaixo se precisar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Mensagem da solicitação</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copiarMensagemSalva}
              className="gap-1.5"
            >
              {copiadaSalva ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiadaSalva ? "Copiado!" : "Copiar mensagem"}
            </Button>
          </div>

          <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-foreground">
            {mensagemSalva || "Mensagem gerada."}
          </pre>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Esta janela fica aberta até você fechá-la ou atualizar a página.
            </p>
            <Button variant="outline" onClick={() => setModalSalvoAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormBlock1 } from "@/components/RequestForm/FormBlock1";
import { FormBlock2 } from "@/components/RequestForm/FormBlock2";
import { FormBlock3 } from "@/components/RequestForm/FormBlock3";
import { FormBlock4 } from "@/components/RequestForm/FormBlock4";
import { Sale, ReturnRequest } from "@/types/sale";
import { useToast } from "@/hooks/use-toast";
import { Package2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolveVendor = (obj: any) => {
    const keys = ["vendedor", "VENDEDOR", "Vendedor", "nome_vendedor", "NOME_VENDEDOR", "seller"];
    for (const k of keys) {
      const v = obj?.[k];
      if (v) return String(v);
    }
    return "";
  };
  useEffect(() => {
    if (tipoSolicitacao !== "cancelamento" && tipoDevolucao === "Parcial") {
      setSelectedItems([]);
      setReturnQuantities({});
    }
  }, [tipoDevolucao, tipoSolicitacao]);

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
      console.log('Buscando venda:', { numeroLancamento, filial });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const resp = await fetch('/api-n8n/webhook/devolucao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_lancamento: numeroLancamento,
          filial: filial,
        }),
        mode: 'cors',
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

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("A resposta do n8n não é um JSON válido.");
      }

      if (Array.isArray(data) && data.length > 0) {
        const normalized = { ...data[0], vendedor: resolveVendor(data[0]) };
        setSale(normalized as Sale);
        setSelectedItems([]);
        setReturnQuantities({});
        toast({
          title: "Venda encontrada",
          description: `Venda ${data[0].numero_lancamento} carregada com sucesso`,
        });
      } else if (data && !Array.isArray(data) && (data.numero_lancamento || data.itens_vendidos)) {
        // Caso o n8n retorne um objeto válido ao invés de array
        const normalized = { ...data, vendedor: resolveVendor(data) };
        setSale(normalized as Sale);
        setSelectedItems([]);
        setReturnQuantities({});
        toast({
          title: "Venda encontrada",
          description: `Venda ${data.numero_lancamento} carregada com sucesso`,
        });
      } else {
        throw new Error("A resposta não contém dados de venda válidos.");
      }
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      const msg = (error as Error)?.message || '';
      const inactiveTest = msg.toLowerCase().includes('not registered');
      const wrongMethod = msg.toLowerCase().includes('not registered for get');
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

  const handleSubmit = async () => {
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

    if (!motivoDevolucao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o motivo da devolução",
        variant: "destructive",
      });
      return;
    }

    const tipoSolicitacaoLabel =
      tipoSolicitacao === "devolucao_com_credito" ? "Devolução com crédito" :
        tipoSolicitacao === "devolucao_sem_credito" ? "Devolução sem crédito" :
          "Cancelamento";

    const requestData: ReturnRequest = {
      filial,
      solicitante,
      tipo_solicitacao: tipoSolicitacaoLabel,
      tipo_devolucao: tipoSolicitacao === "cancelamento" ? "Total" : tipoDevolucao,
      numero_lancamento: sale.numero_lancamento,
      tipo_operacao: sale.tipo_operacao,
      nome_cliente: sale.nome_cliente,
      cpf_cnpj: sale.cpf_cnpj,
      vendedor: sale.vendedor,
      data_hora_solicitacao: new Date().toLocaleString('pt-BR', { hour12: false }),
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
    };

    setIsSubmitting(true);
    try {
      console.log('Enviando solicitação:', {
        filial,
        solicitante,
        tipo_solicitacao: tipoSolicitacaoLabel,
        numero_lancamento: sale.numero_lancamento,
      });
      console.log('Payload:', requestData);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const resp = await fetch('/api-n8n/webhook/envia-zap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        mode: 'cors',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || `Erro ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Resposta do WhatsApp:', data);

      toast({
        title: "Sucesso!",
        description: "Solicitação enviada com sucesso para o WhatsApp.",
      });

      // Reset form
      setFilial("");
      setSolicitante("");
      setTipoSolicitacao("");
      setTipoDevolucao("");
      setNumeroLancamento("");
      setSale(null);
      setSelectedItems([]);
      setReturnQuantities({});
      setMotivoDevolucao("");
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = sale && selectedItems.length > 0 && motivoDevolucao.trim() !== "";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Package2 className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Lojão</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Solicitação de Devolução / Cancelamento
          </p>
        </div>

        <Card>
          <CardHeader>
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
                  motivoDevolucao={motivoDevolucao}
                  onMotivoDevolucaoChange={setMotivoDevolucao}
                  onSubmit={handleSubmit}
                  isLoading={isSubmitting}
                  canSubmit={canSubmit}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;

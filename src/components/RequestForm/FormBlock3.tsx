import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sale, SaleItem } from "@/types/sale";
import { ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";

interface FormBlock3Props {
  sale: Sale | null;
  tipoDevolucao: string;
  tipoSolicitacao: string;
  selectedItems: number[];
  onSelectedItemsChange: (items: number[]) => void;
  returnQuantities: Record<number, number>;
  onReturnQuantityChange: (sequencia: number, quantidade: number) => void;
}

export const FormBlock3 = ({
  sale,
  tipoDevolucao,
  tipoSolicitacao,
  selectedItems,
  onSelectedItemsChange,
  returnQuantities,
  onReturnQuantityChange,
}: FormBlock3Props) => {
  if (!sale) return null;

  const isAutoSelect = tipoDevolucao === "Total" || tipoSolicitacao === "cancelamento";

  useEffect(() => {
    if (isAutoSelect && sale) {
      onSelectedItemsChange(sale.itens_vendidos.map((item) => item.sequencia_item));
    }
  }, [isAutoSelect, sale, onSelectedItemsChange]);

  const handleItemToggle = (sequencia: number) => {
    if (isAutoSelect) return;

    if (selectedItems.includes(sequencia)) {
      onSelectedItemsChange(selectedItems.filter((id) => id !== sequencia));
    } else {
      onSelectedItemsChange([...selectedItems, sequencia]);
      const prod = sale.itens_vendidos.find((i) => i.sequencia_item === sequencia);
      if (prod && prod.quantidade_vendida > 1) {
        onReturnQuantityChange(sequencia, 1);
      }
    }
  };

  const handleContainerClick = (e: any, sequencia: number) => {
    if (isAutoSelect) return;
    const el = e.target as HTMLElement;
    if (el.closest('input') || el.closest('button')) return;
    handleItemToggle(sequencia);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Produtos para Devolução
        </CardTitle>
        {isAutoSelect && (
          <p className="text-sm text-muted-foreground">
            Todos os produtos foram selecionados automaticamente
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sale.itens_vendidos.map((item) => (
            <div
              key={item.sequencia_item}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                selectedItems.includes(item.sequencia_item)
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card hover:bg-muted/50"
              } ${isAutoSelect ? "cursor-default" : "cursor-pointer"}`}
              onClick={(e) => handleContainerClick(e, item.sequencia_item)}
            >
              <Checkbox
                checked={selectedItems.includes(item.sequencia_item)}
                onCheckedChange={() => handleItemToggle(item.sequencia_item)}
                disabled={isAutoSelect}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.nome_produto}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Código: {item.codigo_produto} | Seq: {item.sequencia_item}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.valor_unitario)}</p>
                    <p className="text-sm text-muted-foreground">
                      Qtd: {item.quantidade_vendida}
                    </p>
                  </div>
                </div>
                {(!isAutoSelect && selectedItems.includes(item.sequencia_item) && item.quantidade_vendida > 1) && (
                  <div className="mt-3 grid grid-cols-2 gap-3 items-center">
                    <span className="text-sm text-muted-foreground">Quantidade para devolver</span>
                    <Input
                      type="number"
                      min={1}
                      max={item.quantidade_vendida}
                      value={returnQuantities[item.sequencia_item] ?? 1}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || "1", 10);
                        const clamped = Math.min(Math.max(v, 1), item.quantidade_vendida);
                        onReturnQuantityChange(item.sequencia_item, clamped);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

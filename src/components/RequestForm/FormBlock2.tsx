import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sale } from "@/types/sale";
import { Package } from "lucide-react";

interface FormBlock2Props {
  sale: Sale | null;
}

export const FormBlock2 = ({ sale }: FormBlock2Props) => {
  if (!sale) return null;

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
          <Package className="w-5 h-5 text-primary" />
          Dados da Venda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Número do lançamento</p>
            <p className="text-lg font-semibold">{sale.numero_lancamento}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de operação</p>
            <p className="text-lg font-semibold">{sale.tipo_operacao}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nome do cliente</p>
            <p className="text-lg font-semibold">{sale.nome_cliente}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
            <p className="text-lg font-semibold">{sale.cpf_cnpj}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vendedor</p>
            <p className="text-lg font-semibold">{sale.vendedor || ""}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Itens Vendidos</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Seq.</TableHead>
                  <TableHead className="w-32">Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-32 text-right">Quantidade</TableHead>
                  <TableHead className="w-32 text-right">Valor Unit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.itens_vendidos.map((item) => (
                  <TableRow key={item.sequencia_item}>
                    <TableCell className="font-medium">{item.sequencia_item}</TableCell>
                    <TableCell>{item.codigo_produto}</TableCell>
                    <TableCell>{item.nome_produto}</TableCell>
                    <TableCell className="text-right">{item.quantidade_vendida}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

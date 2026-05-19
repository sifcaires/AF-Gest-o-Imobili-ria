import React, { useState } from 'react';
import { 
  CreditCard, 
  FileDown, 
  FileText, 
  Trash2 
} from 'lucide-react';
import { 
  Card, 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
} from '@/components/ui/dialog';
import { Payment, Contract, Tenant, Property } from '../../types';
import { boletoService } from '../../services/boletoService';
import { toast } from 'sonner';

interface PaymentsViewProps {
  payments: Payment[];
  contracts: Contract[];
  tenants: Tenant[];
  properties: Property[];
  onEdit: (p: Payment) => void;
  onDelete: (id: string) => void;
}

export function PaymentsView({ payments, contracts, tenants, properties, onEdit, onDelete }: PaymentsViewProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const getTenantName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return 'N/A';
    const tenant = tenants.find(t => t.id === contract.tenantId);
    return tenant?.name || 'N/A';
  };

  const handleGenerateBoleto = async (payment: Payment) => {
    setIsGenerating(payment.id);
    try {
      const contract = contracts.find(c => c.id === payment.contractId);
      const tenant = tenants.find(t => t.id === contract?.tenantId);
      const property = properties.find(p => p.id === contract?.propertyId);

      if (!contract || !tenant || !property) {
        toast.error('Dados incompletos para gerar o boleto');
        return;
      }

      await boletoService.generateForPayment(payment, tenant, property);
      toast.success('Boleto gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao gerar boleto');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Módulo Financeiro</h2>
          <p className="text-slate-400 font-medium mt-1">Conciliação de faturas e controle de inadimplência.</p>
        </div>
        <div className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
           <Button variant="ghost" className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white/10 text-white hover:bg-white/20 transition-all">Todos</Button>
           <Button variant="ghost" className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all">Pendentes</Button>
           <Button variant="ghost" className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">Liquidados</Button>
        </div>
      </div>

      <Card className="border-white/10 shadow-2xl backdrop-blur-md bg-white/5 overflow-hidden rounded-3xl border">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 px-10 text-slate-400">Lançamento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Vencimento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Valor Bruto</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Status</TableHead>
              <TableHead className="text-right py-8 px-10 text-slate-400">Operações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-white/5 transition-all border-b border-white/5 group">
                <TableCell className="py-8 px-10 text-white">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm tracking-tight">{getTenantName(payment.contractId)}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cobrança Mensal #{payment.id}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-slate-400 italic">{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-lg font-bold text-white font-mono tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                </TableCell>
                <TableCell>
                  <Badge className={
                    payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10 font-bold px-4 py-1.5' : 
                    payment.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-500/10 font-bold px-4 py-1.5' : 
                    'bg-slate-900/50 text-white border-white/10 shadow-lg shadow-slate-900/50 font-bold px-4 py-1.5 border'
                  }>
                    {payment.status === 'paid' ? 'LIQUIDADO' : payment.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-10">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <Button 
                      variant="outline" 
                      onClick={() => onEdit(payment)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                    <Dialog open={!!selectedPayment && selectedPayment.id === payment.id} onOpenChange={(open) => !open && setSelectedPayment(null)}>
                      <DialogTrigger
                        render={
                          <Button 
                            className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest gap-3 shadow-xl shadow-indigo-500/25 transition-all"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <FileDown className="h-4 w-4" />
                            Boleto
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-white/10 shadow-2xl rounded-3xl frosted">
                        <div className="bg-indigo-600 text-white p-10 flex flex-col items-center gap-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 -translate-y-20"></div>
                          <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl scale-110">
                             <CreditCard className="h-10 w-10 text-white" />
                          </div>
                          <div className="text-center relative z-10">
                            <h3 className="text-3xl font-bold serif italic">Opções de Cobrança</h3>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Referente: {new Date(payment.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="p-10 space-y-8 bg-white/5">
                           <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-8">
                            <div>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Sacado</span>
                               <p className="text-lg font-bold text-white serif italic">{getTenantName(payment.contractId)}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Total Recibo</span>
                               <p className="text-2xl font-bold text-white font-mono tracking-tighter">
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                               </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-4 pt-6">
                            <Button 
                              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 uppercase tracking-widest text-[10px]"
                              onClick={() => handleGenerateBoleto(payment)}
                              disabled={isGenerating === payment.id}
                            >
                              {isGenerating === payment.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              Baixar PDF do Boleto
                            </Button>
                            <Button variant="ghost" className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest h-12 hover:bg-white/5 hover:text-white" onClick={() => setSelectedPayment(null)}>
                              Voltar ao Financeiro
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      onClick={() => onDelete(payment.id)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/10 text-rose-400 border hover:border-rose-500/50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

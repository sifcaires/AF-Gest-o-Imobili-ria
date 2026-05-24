import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  FileText,
  Percent,
  MessageSquareCode,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Payment, Contract, Tenant, Property } from '../types';

interface PaymentFormProps {
  contracts: Contract[];
  tenants: Tenant[];
  properties: Property[];
  onSubmit: (data: Omit<Payment, 'id'>) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<Payment>;
}

export function PaymentForm({ contracts, tenants, properties, onSubmit, isLoading, initialData }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    contractId: initialData?.contractId || '',
    dueDate: initialData?.dueDate || new Date().toISOString().split('T')[0],
    amount: initialData?.amount || 0,
    status: initialData?.status || 'pending',
    paymentDate: initialData?.paymentDate || '',
    // New customized fields
    title: initialData?.title || 'Aluguel Mensal',
    penaltyPercent: initialData?.penaltyPercent !== undefined ? initialData.penaltyPercent : 10,
    interestPercent: initialData?.interestPercent !== undefined ? initialData.interestPercent : 1,
    discountAmount: initialData?.discountAmount !== undefined ? initialData.discountAmount : 0,
    discountStartDate: initialData?.discountStartDate || '',
    discountEndDate: initialData?.discountEndDate || '',
    instructions: initialData?.instructions || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.contractId) return;
    await onSubmit(formData as unknown as Omit<Payment, 'id'>);
  };

  const getContractDescription = (contract: Contract) => {
    const property = properties.find(p => p.id === contract.propertyId);
    const tenant = tenants.find(t => t.id === contract.tenantId);
    return `${tenant?.name || 'Inquilino'} - ${property?.title || 'Imóvel'}`;
  };

  // When a contract is selected, update the amount to the contract's rent amount
  const handleContractChange = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    setFormData({
      ...formData,
      contractId,
      amount: contract?.rentAmount || formData.amount
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-1.5 px-1">
      <div className="space-y-3">
        
        {/* Identificação de Contrato */}
        <div className="space-y-2">
          <Label htmlFor="contractId" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contrato de Locação Associado</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
            <Select 
              value={formData.contractId} 
              onValueChange={handleContractChange}
              required
            >
              <SelectTrigger id="contractId" className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50">
                <SelectValue placeholder="Selecione o contrato de locação" />
              </SelectTrigger>
              <SelectContent className="frosted border-white/10 text-white bg-slate-900">
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id} className="hover:bg-white/10">
                    {getContractDescription(contract)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Título do Boleto/Cobrança */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Título / Espécie do Boleto</Label>
            <Select 
              value={formData.title} 
              onValueChange={(val) => setFormData({ ...formData, title: val })}
            >
              <SelectTrigger id="title" className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50">
                <SelectValue placeholder="Selecione o título" />
              </SelectTrigger>
              <SelectContent className="frosted border-white/10 text-white bg-slate-900">
                <SelectItem value="Aluguel Mensal">Aluguel Mensal (Padrão)</SelectItem>
                <SelectItem value="Cobrança Consolidada">Aluguel + IPTU + Condomínio</SelectItem>
                <SelectItem value="Reparo / Manutenção">Reparos e Manutenções</SelectItem>
                <SelectItem value="Multa Contratual">Multa Contratual / Rescisória</SelectItem>
                <SelectItem value="Taxa de Condomínio Extra">Taxa Condominial Extra</SelectItem>
                <SelectItem value="Outros / Ajustes">Outros Lançamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor Nominal Cobrado (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Juros e Multas por Atraso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
          <div className="space-y-1.5">
            <Label htmlFor="penaltyPercent" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              Multa por Atraso (%)
            </Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
              <Input
                id="penaltyPercent"
                type="number"
                step="0.1"
                placeholder="10"
                value={formData.penaltyPercent}
                onChange={(e) => setFormData({ ...formData, penaltyPercent: parseFloat(e.target.value) || 0 })}
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interestPercent" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              Juros de Mora (% / mês)
            </Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
              <Input
                id="interestPercent"
                type="number"
                step="0.1"
                placeholder="1"
                value={formData.interestPercent}
                onChange={(e) => setFormData({ ...formData, interestPercent: parseFloat(e.target.value) || 0 })}
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discountAmount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              Desconto Pontual (R$)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Datas de Validade do Desconto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-xl">
          <div className="space-y-1.5">
            <Label htmlFor="discountStartDate" className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data de Início do Desconto
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <Input
                id="discountStartDate"
                type="date"
                value={formData.discountStartDate}
                onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-emerald-500/50 [color-scheme:dark] text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discountEndDate" className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data Limite do Desconto
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <Input
                id="discountEndDate"
                type="date"
                value={formData.discountEndDate}
                onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-emerald-500/50 [color-scheme:dark] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Datas e Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-xs">Status Inicial de Cobrança</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                {formData.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                 formData.status === 'overdue' ? <AlertCircle className="h-4 w-4 text-rose-400" /> :
                 <Clock className="h-4 w-4 text-indigo-400" />}
              </div>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData({ ...formData, status: val as any })}
              >
                <SelectTrigger id="status" className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="frosted border-white/10 text-white bg-slate-900">
                  <SelectItem value="pending" className="hover:bg-white/10">Pendente (Normal)</SelectItem>
                  <SelectItem value="paid" className="hover:bg-white/10">Pago (Baixado no Servidor)</SelectItem>
                  <SelectItem value="overdue" className="hover:bg-white/10">Atrasado / Inadimplente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data de Vencimento</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="border-white/10 bg-white/5 text-white h-10 pl-10 rounded-xl focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Informações Extras de Pagador / Instruções no boleto */}
        <div className="space-y-1.5">
          <Label htmlFor="instructions" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <MessageSquareCode className="h-3 w-3" /> Instruções Impressas no Boleto (Opcional)
          </Label>
          <Input 
            id="instructions"
            placeholder="Ex: Não aceitar após vencimento. Contatar tel: (11) 9999-1111..."
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <Button 
          type="submit" 
          disabled={isLoading || !formData.contractId}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Emitir Nova Fatura e Gerar Boleto
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

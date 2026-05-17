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
  User,
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
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.contractId) return;
    await onSubmit(formData as Omit<Payment, 'id'>);
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
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contractId" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contrato / Inquilino</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
            <Select 
              value={formData.contractId} 
              onValueChange={handleContractChange}
              required
            >
              <SelectTrigger id="contractId" className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50">
                <SelectValue placeholder="Selecione o contrato" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor do Recibo (R$)</Label>
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
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status do Pagamento</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                {formData.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                 formData.status === 'overdue' ? <AlertCircle className="h-4 w-4 text-rose-400" /> :
                 <Clock className="h-4 w-4 text-amber-400" />}
              </div>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData({ ...formData, status: val as any })}
              >
                <SelectTrigger id="status" className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="frosted border-white/10 text-white bg-slate-900">
                  <SelectItem value="pending" className="hover:bg-white/10">Pendente</SelectItem>
                  <SelectItem value="paid" className="hover:bg-white/10">Pago / Liquidado</SelectItem>
                  <SelectItem value="overdue" className="hover:bg-white/10">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data de Vencimento</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data do Pagamento (Opcional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 opacity-50" />
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5">
        <Button 
          type="submit" 
          disabled={isLoading || !formData.contractId}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Gerar Registro de Recibo
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

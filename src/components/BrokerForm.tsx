import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  CreditCard,
  Percent
} from 'lucide-react';
import { Broker } from '../types';
import { maskPhone } from '../lib/masks';

interface BrokerFormProps {
  initialData?: Partial<Broker>;
  onSubmit: (data: Omit<Broker, 'id'>) => Promise<void>;
  isLoading?: boolean;
  currentUserName?: string;
}

export function BrokerForm({ initialData, onSubmit, isLoading, currentUserName }: BrokerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    creci: initialData?.creci || '',
    commissionPercent: initialData?.commissionPercent || 10,
    pixKey: initialData?.pixKey || '',
    registeredBy: initialData?.registeredBy || currentUserName || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      email: formData.email.toLowerCase().trim(),
      commissionPercent: Number(formData.commissionPercent)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nome do Corretor / Corretora</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="name"
              placeholder="Ex: Carlos M. de Souza"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">E-mail de Contato</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="corretor@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Telefone / WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="creci" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">CRECI (Nº Registro)</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="creci"
                placeholder="Ex: 12345-F ou SP-12345"
                value={formData.creci}
                onChange={(e) => setFormData({ ...formData, creci: e.target.value.toUpperCase() })}
                required
                className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="commissionPercent" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Comissão Admissível (%)</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="commissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="10"
                value={formData.commissionPercent}
                onChange={(e) => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="pixKey" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Chave PIX (Para Pagamentos/Repasses)</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="pixKey"
              placeholder="Chave PIX (E-mail, CPF, Celular, etc)"
              value={formData.pixKey}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="registeredBy" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Cadastrado por</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <Input
              id="registeredBy"
              type="text"
              readOnly
              disabled
              value={formData.registeredBy || 'Corretor Master'}
              className="border-white/10 bg-white/5 opacity-80 text-white/70 h-11 pl-10 rounded-xl cursor-not-allowed select-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-[10px] transition-all transform hover:-translate-y-0.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            initialData ? 'Atualizar Cadastro' : 'Finalizar Cadastro'
          )}
        </Button>
      </div>
    </form>
  );
}

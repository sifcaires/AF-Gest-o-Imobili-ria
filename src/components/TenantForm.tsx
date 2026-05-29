import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  Briefcase, 
  DollarSign, 
  Calendar as CalendarIcon,
  MapPin
} from 'lucide-react';
import { Tenant } from '../types';
import { maskCPF, maskPhone } from '../lib/masks';

interface TenantFormProps {
  initialData?: Partial<Tenant>;
  onSubmit: (data: Omit<Tenant, 'id'>) => Promise<void>;
  isLoading?: boolean;
  userRole?: string;
}

export function TenantForm({ initialData, onSubmit, isLoading, userRole }: TenantFormProps) {
  const isReadOnly = userRole === 'broker';

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    cpf: initialData?.cpf || '',
    rg: initialData?.rg || '',
    birthDate: initialData?.birthDate || '',
    profession: initialData?.profession || '',
    monthlyIncome: initialData?.monthlyIncome || 0,
    address: initialData?.address || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nome Completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="name"
              placeholder="Ex: João da Silva"
              value={formData.name}
              disabled={isReadOnly}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Endereço</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="address"
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={formData.address}
              disabled={isReadOnly}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                disabled={isReadOnly}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Telefone / WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                disabled={isReadOnly}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">CPF</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                disabled={isReadOnly}
                onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">RG</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 opacity-50" />
              <Input
                id="rg"
                placeholder="00.000.000-0"
                value={formData.rg}
                disabled={isReadOnly}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Data de Nascimento</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                disabled={isReadOnly}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profession" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Profissão</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="profession"
                placeholder="Ex: Engenheiro"
                value={formData.profession}
                disabled={isReadOnly}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 max-w-[50%]">
          <Label htmlFor="monthlyIncome" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Renda Mensal Estimada (R$)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              id="monthlyIncome"
              type="number"
              placeholder="0.00"
              value={formData.monthlyIncome || ''}
              disabled={isReadOnly}
              onChange={(e) => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) || 0 })}
              className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </div>

      {isReadOnly ? (
        <div className="w-full bg-slate-800 text-slate-400 font-bold h-14 rounded-2xl flex items-center justify-center border border-white/5 uppercase tracking-widest text-[10px]">
          Modo Somente Visualização (Corretor)
        </div>
      ) : (
        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs transition-all transform hover:-translate-y-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Finalizar Cadastro de Inquilino'
            )}
          </Button>
        </div>
      )}
    </form>
  );
}

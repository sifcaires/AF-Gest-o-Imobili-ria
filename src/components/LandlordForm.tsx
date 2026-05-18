import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  MapPin, 
  CreditCard
} from 'lucide-react';
import { Landlord } from '../types';
import { maskPhone, maskCPFouCNPJ } from '../lib/masks';

interface LandlordFormProps {
  initialData?: Partial<Landlord>;
  onSubmit: (data: Omit<Landlord, 'id'>) => Promise<void>;
  isLoading?: boolean;
}

export function LandlordForm({ initialData, onSubmit, isLoading }: LandlordFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    cpfCnpj: initialData?.cpfCnpj || '',
    pixKey: initialData?.pixKey || '',
    address: initialData?.address || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome Completo / Razão Social</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="name"
              placeholder="Ex: João da Silva ou Imobiliária Silva LTDA"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefone / WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpfCnpj" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CPF / CNPJ</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="cpfCnpj"
                placeholder="000.000.000-00"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: maskCPFouCNPJ(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pixKey" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chave PIX (Para Recebimento)</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="pixKey"
                placeholder="E-mail, CPF, Celular ou Aleatória"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Endereço Residencial/Comercial</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="address"
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border-white/10 bg-white/5 text-white h-12 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs transition-all transform hover:-translate-y-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            initialData ? 'Atualizar Cadastro de Locador' : 'Finalizar Cadastro de Locador'
          )}
        </Button>
      </div>
    </form>
  );
}

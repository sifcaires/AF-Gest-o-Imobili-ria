import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tenant } from '../types';

interface TenantFormProps {
  initialData?: Partial<Tenant>;
  onSubmit: (data: Omit<Tenant, 'id'>) => Promise<void>;
  isLoading?: boolean;
}

export function TenantForm({ initialData, onSubmit, isLoading }: TenantFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    cpf: initialData?.cpf || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome Completo</Label>
        <Input
          id="name"
          placeholder="Ex: João da Silva"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="exemplo@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefone / WhatsApp</Label>
          <Input
            id="phone"
            placeholder="(11) 99999-9999"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CPF</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            required
            className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs transition-all transform hover:-translate-y-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Salvar Inquilino'
          )}
        </Button>
      </div>
    </form>
  );
}

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landlord, Property } from '../types';

interface PropertyFormProps {
  initialData?: Partial<Property>;
  landlords: Landlord[];
  onSubmit: (data: Omit<Property, 'id' | 'ownerId'>) => Promise<void>;
  isLoading?: boolean;
}

export function PropertyForm({ initialData, landlords, onSubmit, isLoading }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    address: initialData?.address || '',
    rentAmount: initialData?.rentAmount || 0,
    status: initialData?.status || 'available' as const,
    landlordId: initialData?.landlordId || '',
    imageUrl: initialData?.imageUrl || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800',
    iptuAmount: initialData?.iptuAmount || 0,
    condoAmount: initialData?.condoAmount || 0,
    requiresGuarantor: initialData?.requiresGuarantor || false,
    requiresDeposit: initialData?.requiresDeposit || false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-1 text-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Proprietário */}
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="landlordId" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proprietário (Locador)</Label>
          <Select 
            value={formData.landlordId} 
            onValueChange={(value) => setFormData({ ...formData, landlordId: value })}
            required
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white h-10 rounded-xl w-[285.238px]">
              <SelectValue placeholder="Selecione o proprietário" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
              {landlords.map((landlord) => (
                <SelectItem key={landlord.id} value={landlord.id}>{landlord.name}</SelectItem>
              ))}
              {landlords.length === 0 && (
                <div className="py-2 px-8 text-xs text-slate-500 italic">Nenhum locador cadastrado.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Status Inicial */}
        <div className="space-y-1 pr-0">
          <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-[5px] mr-[47px] ml-[68px]">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: 'available' | 'rented') => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white rounded-xl w-[119.32px] h-[47.9936px] mr-0 mb-0 mt-0 ml-[75px] pt-[9px] pb-[10px] pl-[10px] pr-[9px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="rented">Locado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Título do Imóvel */}
      <div className="space-y-1">
        <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Título do Imóvel</Label>
        <Input
          id="title"
          placeholder="Ex: Apartamento Moderno no Centro"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50 pt-0 pb-0 pr-0 pl-2 ml-0 mt-0 mr-[-2px] mb-[-1px]"
        />
      </div>

      {/* Endereço Completo */}
      <div className="space-y-1">
        <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Endereço Completo</Label>
        <Input
          id="address"
          placeholder="Rua, Número, Bairro, Cidade"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
          className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50"
        />
      </div>

      {/* Valores: Aluguel, Condomínio, IPTU */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="rentAmount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aluguel (R$)</Label>
          <Input
            id="rentAmount"
            type="number"
            placeholder="0.00"
            value={formData.rentAmount || ''}
            onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })}
            required
            className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="condoAmount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Condomínio (R$)</Label>
          <Input
            id="condoAmount"
            type="number"
            placeholder="0.00"
            value={formData.condoAmount || ''}
            onChange={(e) => setFormData({ ...formData, condoAmount: parseFloat(e.target.value) || 0 })}
            className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="iptuAmount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IPTU (R$)</Label>
          <Input
            id="iptuAmount"
            type="number"
            placeholder="0.00"
            value={formData.iptuAmount || ''}
            onChange={(e) => setFormData({ ...formData, iptuAmount: parseFloat(e.target.value) || 0 })}
            className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Garantias Exigidas para Locação */}
      <div className="space-y-1 mb-1">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Garantias Exigidas</Label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-white/5 cursor-pointer select-none transition-colors hover:bg-white/10">
            <input 
              type="checkbox"
              checked={formData.requiresGuarantor}
              onChange={(e) => setFormData({ ...formData, requiresGuarantor: e.target.checked })}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50 accent-indigo-600"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">Exige Fiador</span>
              <span className="text-[9px] text-slate-400 leading-none">Fiador idôneo</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-white/5 cursor-pointer select-none transition-colors hover:bg-white/10">
            <input 
              type="checkbox"
              checked={formData.requiresDeposit}
              onChange={(e) => setFormData({ ...formData, requiresDeposit: e.target.checked })}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50 accent-indigo-600"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">Exige Caução</span>
              <span className="text-[9px] text-slate-400 leading-none">Depósito caução</span>
            </div>
          </label>
        </div>
      </div>

      {/* Descrição e Link Foto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1 pt-[-1px] pl-[2px] ml-0 mr-0 mt-0 pr-[-9px] pb-0">
          <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descrição Detalhada</Label>
          <textarea
            id="description"
            rows={1}
            className="w-full rounded-xl border border-white/10 bg-white/5 pt-0 pb-[91px] ml-0 mr-0 mt-0 mb-[-8px] pl-[6px] pr-0 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none h-[42px]"
            placeholder="Ex: 2 quartos, semi-mobiliado, próximo ao metrô..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="imageUrl" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Link Foto (Opcional)</Label>
          <Input
            id="imageUrl"
            placeholder="https://images.unsplash.com/..."
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="border-white/10 bg-white/5 text-white h-10 rounded-xl focus:ring-indigo-500/50 text-xs"
          />
        </div>
      </div>

      <div className="pt-[28px] pb-0 ml-0 -mt-[27px] pl-[5px] pr-0 mr-0 mb-0">
        <Button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs transition-all transform hover:-translate-y-0.5 pt-0 pl-0 ml-0 mr-0 mt-[13px] mb-0 pr-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Salvar Imóvel'
          )}
        </Button>
      </div>
    </form>
  );
}

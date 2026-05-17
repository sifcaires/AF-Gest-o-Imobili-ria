import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Property } from '../types';

interface PropertyFormProps {
  initialData?: Partial<Property>;
  onSubmit: (data: Omit<Property, 'id'>) => Promise<void>;
  isLoading?: boolean;
}

export function PropertyForm({ initialData, onSubmit, isLoading }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    address: initialData?.address || '',
    rentAmount: initialData?.rentAmount || 0,
    status: initialData?.status || 'available' as const,
    imageUrl: initialData?.imageUrl || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Título do Imóvel</Label>
        <Input
          id="title"
          placeholder="Ex: Apartamento Moderno no Centro"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Endereço Completo</Label>
        <Input
          id="address"
          placeholder="Rua, Número, Bairro, Cidade"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
          className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rentAmount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aluguel Mensal (R$)</Label>
          <Input
            id="rentAmount"
            type="number"
            placeholder="0.00"
            value={formData.rentAmount || ''}
            onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })}
            required
            className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Inicial</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: 'available' | 'rented') => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white h-12 rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="rented">Locado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descrição Detalhada</Label>
        <textarea
          id="description"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          placeholder="Ex: 2 quartos, semi-mobiliado, próximo ao metrô..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Link da Foto (Opcional)</Label>
        <Input
          id="imageUrl"
          placeholder="https://images.unsplash.com/..."
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
        />
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
            'Salvar Imóvel'
          )}
        </Button>
      </div>
    </form>
  );
}

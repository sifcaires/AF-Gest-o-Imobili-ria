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
  CreditCard,
  FileText
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
    documentUrl: initialData?.documentUrl || '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (file) {
      // In a real app we'd upload here. For now we pass the form data.
      // The parent handles the file upload if file is present.
      await onSubmit({ ...formData, file } as any);
    } else {
      await onSubmit(formData);
    }
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

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Documento Scaneado (RG/CPF ou Contrato Social)</Label>
          <div className="flex items-center gap-4">
            <div 
              onClick={() => document.getElementById('landlordDocument')?.click()}
              className="flex-1 cursor-pointer border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/5 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-300">
                  {file ? file.name : (formData.documentUrl ? 'Documento já cadastrado' : 'Clique para selecionar')}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">PDF ou Imagem (Máx 5MB)</p>
              </div>
              <input 
                id="landlordDocument"
                type="file" 
                className="hidden" 
                accept=".pdf,image/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {formData.documentUrl && (
              <a 
                href={formData.documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-full px-4 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Ver Atual
              </a>
            )}
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

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
  FileText,
  X,
  Upload,
  Loader2
} from 'lucide-react';
import { Landlord } from '../types';
import { maskPhone, maskCPFouCNPJ } from '../lib/masks';
import { toast } from 'sonner';
import { getSafeDocumentUrl, viewDocumentSecurely } from '../lib/documentViewer';

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
    documentUrls: initialData?.documentUrls || (initialData?.documentUrl ? [initialData.documentUrl] : []),
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (files.length > 0) {
      await onSubmit({ ...formData, files } as any);
      setFiles([]);
    } else {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nome Completo / Razão Social</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="name"
              placeholder="Ex: João da Silva ou Imobiliária Silva LTDA"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
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
            <Label htmlFor="cpfCnpj" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">CPF / CNPJ</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="cpfCnpj"
                placeholder="000.000.000-00"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: maskCPFouCNPJ(e.target.value) })}
                required
                className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pixKey" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Chave PIX (Para Recebimento)</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="pixKey"
                placeholder="E-mail, CPF, Celular ou Aleatória"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="address" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Endereço Residencial/Comercial</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="address"
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border-white/10 bg-white/5 text-white h-11 pl-10 rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center bg-white/5 p-1.5 rounded-lg border border-white/5">
            <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Documentos Escaneados (RG, CPF, Contrato Social, etc - Máx 5)</Label>
            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">
              {files.length + (formData.documentUrls?.length || 0)} / 5
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {/* File dropzone/button */}
            {(files.length + (formData.documentUrls?.length || 0) < 5) && (
              <div 
                onClick={() => document.getElementById('landlordDocuments')?.click()}
                className="cursor-pointer border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/5 rounded-xl p-2.5 transition-all flex items-center gap-3 group hover:bg-white/10"
              >
                <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate">
                    Clique para selecionar documentos
                  </p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">PDF ou Imagem (Máx 5MB cada, até 5 arquivos)</p>
                </div>
                <input 
                  id="landlordDocuments"
                  type="file" 
                  className="hidden" 
                  accept=".pdf,image/*" 
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const selectedFiles = Array.from(e.target.files);
                      const currentTotal = files.length + (formData.documentUrls?.length || 0);
                      
                      if (currentTotal + selectedFiles.length > 5) {
                        toast.error('O limite padrão é de no máximo 5 documentos por locador.');
                        return;
                      }

                      const validFiles = selectedFiles.filter((f: File) => {
                        if (f.size > 5 * 1024 * 1024) {
                          toast.error(`O arquivo ${f.name} excede o limite de 5MB.`);
                          return false;
                        }
                        return true;
                      });

                      if (validFiles.length > 0) {
                        setFiles(prev => [...prev, ...validFiles]);
                        toast.success(`${validFiles.length} arquivo(s) selecionado(s).`);
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* List of existing uploaded files */}
            {formData.documentUrls && formData.documentUrls.length > 0 && (
              <div className="space-y-1 w-full">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 ml-1">Documentos já salvos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {formData.documentUrls.map((url, idx) => {
                    const decodedUrl = decodeURIComponent(url);
                    const fileNameWithToken = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
                    const fileNameParts = fileNameWithToken.split('?')[0].split('_');
                    const displayFileName = fileNameParts.length > 1 && !isNaN(Number(fileNameParts[0])) 
                      ? fileNameParts.slice(1).join('_') 
                      : fileNameParts.join('_');

                    return (
                      <div 
                        key={url} 
                        onClick={() => viewDocumentSecurely(url, displayFileName || `documento_${idx + 1}`)}
                        className="flex items-center justify-between gap-1 bg-white/5 border border-white/10 p-1 rounded-md hover:bg-indigo-500/10 hover:border-indigo-500/30 cursor-pointer active:scale-[0.99] transition-all group/item max-w-[95px] min-w-[75px] flex-grow"
                      >
                        <div className="flex items-center gap-0.5 min-w-0">
                          <FileText className="h-2.5 w-2.5 text-indigo-400 shrink-0 group-hover/item:text-indigo-300 group-hover/item:scale-110 transition-transform" />
                          <span className="text-[9px] text-slate-200 group-hover/item:text-white truncate font-semibold transition-colors" title={displayFileName}>{displayFileName || `Doc ${idx + 1}`}</span>
                        </div>
                        <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                            className="h-4 w-4 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded p-0 flex items-center justify-center shrink-0"
                            onClick={() => {
                              const updatedUrls = formData.documentUrls.filter(item => item !== url);
                              setFormData({
                                ...formData,
                                documentUrls: updatedUrls,
                              });
                              toast.success('Documento removido da lista para exclusão ao salvar.');
                            }}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of newly selected files */}
            {files.length > 0 && (
              <div className="space-y-1 w-full">
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500 ml-1">Novos arquivos p/ enviar (aguardando salvar):</p>
                <div className="flex flex-wrap gap-1.5">
                  {files.map((f: File, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-1 bg-amber-500/5 border border-amber-500/10 p-1 rounded-md max-w-[95px] min-w-[75px] flex-grow">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <FileText className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-white truncate font-semibold" title={f.name}>{f.name}</p>
                          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">{(f.size / 1024 / 1024).toFixed(2)}M</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-slate-400 hover:text-white hover:bg-white/10 rounded shrink-0 flex items-center justify-center p-0"
                        onClick={() => {
                          setFiles(prev => prev.filter((_, i) => i !== idx));
                          toast.success('Removido da seleção.');
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

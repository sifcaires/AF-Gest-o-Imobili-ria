import { useState, FormEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contract, Property, Tenant } from '../types';
import { storage, auth } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FileText, Upload, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContractFormProps {
  properties: Property[];
  tenants: Tenant[];
  onSubmit: (data: Omit<Contract, 'id'>) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<Contract>;
}

export function ContractForm({ properties, tenants, onSubmit, isLoading, initialData }: ContractFormProps) {
  const [formData, setFormData] = useState({
    propertyId: initialData?.propertyId || '',
    tenantId: initialData?.tenantId || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    rentAmount: initialData?.rentAmount || 0,
    dayOfPayment: initialData?.dayOfPayment || 1,
    documentUrl: initialData?.documentUrl || '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    setFormData({ 
      ...formData, 
      propertyId, 
      rentAmount: property?.rentAmount || 0 
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(selectedFile.type) && selectedFile.type !== 'image/jpg') {
        setFileError('Por favor, selecione um arquivo PDF ou Imagem (JPEG/PNG).');
        return;
      }

      if (selectedFile.size > maxSize) {
        setFileError('O arquivo é muito grande. O limite é 5MB.');
        return;
      }

      setFile(selectedFile);
      setUploadProgress(0);
      toast.success('Documento selecionado: ' + selectedFile.name);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId || !formData.tenantId) {
      toast.error('Por favor, selecione o imóvel e o inquilino.');
      return;
    }

    let documentUrl = formData.documentUrl;
    console.log('[ContractForm] Submitting...', { propertyId: formData.propertyId, tenantId: formData.tenantId });

    setUploading(true);
    try {
      if (file) {
        if (!auth.currentUser) {
          throw new Error('Usuário não autenticado para fazer upload.');
        }

        console.log('[ContractForm] Starting file upload...', file.name);
        const fileExt = file.name.split('.').pop();
        const fileName = `contracts/${auth.currentUser.uid}/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        // Use uploadBytesResumable for better feedback and reliability
        const uploadTask = uploadBytesResumable(storageRef, file);

        documentUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log('[ContractForm] Upload progress:', progress.toFixed(2) + '%');
            }, 
            (error) => {
              console.error('[ContractForm] Upload task error:', error);
              reject(new Error(`Erro no upload: ${error.message || 'Falha na conexão com Storage'}`));
            }, 
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('[ContractForm] Upload successful, URL:', downloadUrl);
                resolve(downloadUrl);
              } catch (urlError) {
                reject(urlError);
              }
            }
          );
        });

        toast.success('Documento enviado com sucesso!');
      }

      console.log('[ContractForm] Calling onSubmit...');
      await onSubmit({
        ...formData,
        documentUrl,
      });
      console.log('[ContractForm] onSubmit completed successfully');
      
    } catch (error: any) {
      console.error('[ContractForm] Error in handleSubmit:', error);
      const errorMessage = error.message || 'Houve um problema ao salvar o contrato.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Imóvel</Label>
          <Select 
            value={formData.propertyId} 
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white h-12 rounded-xl">
              <SelectValue placeholder="Selecione o imóvel" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
              {properties
                .filter(p => p.status === 'available' || p.id === formData.propertyId)
                .map(property => (
                  <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inquilino</Label>
          <Select 
            value={formData.tenantId} 
            onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white h-12 rounded-xl">
              <SelectValue placeholder="Selecione o inquilino" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data de Início</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
            className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50 block w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data de Término</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
            className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50 block w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rentAmount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor do Aluguel (R$)</Label>
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
          <Label htmlFor="dayOfPayment" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dia de Vencimento</Label>
          <Input
            id="dayOfPayment"
            type="number"
            min="1"
            max="31"
            placeholder="5"
            value={formData.dayOfPayment}
            onChange={(e) => setFormData({ ...formData, dayOfPayment: parseInt(e.target.value) || 1 })}
            required
            className="border-white/10 bg-white/5 text-white h-12 rounded-xl focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Documento do Contrato (PDF ou Foto)</Label>
        <div className="relative">
          <input
            type="file"
            id="document"
            accept=".pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <Label 
            htmlFor="document" 
            className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group"
          >
            {file ? (
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                      {uploading ? `${Math.round(uploadProgress)}%` : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-indigo-400" />
                </div>
                <p className="text-white text-sm font-medium">Clique para fazer upload</p>
                <p className="text-slate-400 text-xs mt-1">PDF, JPG ou PNG (Máx 5MB)</p>
              </>
            )}
          </Label>
          {fileError && (
            <div className="mt-2 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">{fileError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-purple-500/20 uppercase tracking-widest text-xs transition-all transform hover:-translate-y-1"
          disabled={isLoading || uploading}
        >
          {isLoading || uploading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            'Salvar Contrato'
          )}
        </Button>
      </div>
    </form>
  );
}

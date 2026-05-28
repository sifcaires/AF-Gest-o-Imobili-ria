import { useState, FormEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contract, Property, Tenant, Landlord } from '../types';
import { storage, auth, uploadFileWithFallback } from '../lib/firebase';
import { ref } from 'firebase/storage';
import { FileText, Upload, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSafeDocumentUrl, viewDocumentSecurely } from '../lib/documentViewer';
 
interface ContractFormProps {
  properties: Property[];
  tenants: Tenant[];
  landlords: Landlord[];
  users?: any[];
  onSubmit: (data: Omit<Contract, 'id'>) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<Contract>;
}
 
export function ContractForm({ properties, tenants, landlords, users = [], onSubmit, isLoading, initialData }: ContractFormProps) {
  const [formData, setFormData] = useState({
    propertyId: initialData?.propertyId || '',
    tenantId: initialData?.tenantId || '',
    beneficiaryId: initialData?.beneficiaryId || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    rentAmount: initialData?.rentAmount || 0,
    dayOfPayment: initialData?.dayOfPayment || 1,
    documentUrl: initialData?.documentUrl || '',
    documentUrls: initialData?.documentUrls || (initialData?.documentUrl ? [initialData.documentUrl] : []),
  });
 
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
 
  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    const rent = property?.rentAmount || 0;
    const iptu = property?.iptuAmount || 0;
    const condo = property?.condoAmount || 0;
    const total = rent + iptu + condo;

    setFormData({ 
      ...formData, 
      propertyId, 
      rentAmount: total,
      beneficiaryId: property?.landlordId || ''
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId || !formData.tenantId) {
      toast.error('Por favor, selecione o imóvel e o inquilino.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      let urls: string[] = [];
      if (files.length > 0) {
        if (!auth.currentUser) {
          throw new Error('Usuário não autenticado para fazer upload.');
        }

        console.log('[ContractForm] Starting files upload...', files.length);
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const fileExt = f.name.split('.').pop();
          const fileName = `contracts/${auth.currentUser.uid}/${Date.now()}_${f.name}`;
          const storageRef = ref(storage, fileName);
          const metadata = { contentType: f.type };
          
          const downloadURL = await uploadFileWithFallback(storageRef, f, metadata, (progress) => {
            const baseProgress = (i / files.length) * 100;
            const itemProgress = progress / files.length;
            setUploadProgress(baseProgress + itemProgress);
          });
          urls.push(downloadURL);
        }
        toast.success(`${files.length} documento(s) enviado(s) com sucesso!`);
      }

      const updatedUrls = [...(formData.documentUrls || []), ...urls];
      const primaryUrl = updatedUrls.length > 0 ? updatedUrls[0] : '';

      console.log('[ContractForm] Calling onSubmit...');
      await onSubmit({
        ...formData,
        documentUrl: primaryUrl,
        documentUrls: updatedUrls,
      });
      console.log('[ContractForm] onSubmit completed successfully');
      setFiles([]);
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
              <SelectValue placeholder="Selecione o imóvel">
                {properties.find(p => p.id === formData.propertyId)?.title || (formData.propertyId && properties.length > 0 ? "Imóvel não encontrado" : undefined)}
              </SelectValue>
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
              <SelectValue placeholder="Selecione o inquilino">
                {tenants.find(t => t.id === formData.tenantId)?.name || (formData.tenantId && tenants.length > 0 ? "Inquilino não encontrado" : undefined)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Locador</Label>
        <Select 
          value={formData.beneficiaryId} 
          onValueChange={(value) => setFormData({ ...formData, beneficiaryId: value })}
          required
        >
          <SelectTrigger className="border-white/10 bg-white/5 text-white h-12 rounded-xl pl-[17px] pt-[5px] pr-[90px]">
            <SelectValue placeholder="Selecione o locador">
              {(() => {
                if (!formData.beneficiaryId) return undefined;
                const landlord = landlords.find(l => l.id === formData.beneficiaryId || l.ownerId === formData.beneficiaryId);
                if (landlord) return landlord.name;
                
                const selectedProperty = properties.find(p => p.id === formData.propertyId);
                const propertyOwner = selectedProperty ? landlords.find(l => l.id === selectedProperty.landlordId) : null;
                const creatorId = propertyOwner?.ownerId || selectedProperty?.ownerId;
                
                if (creatorId && formData.beneficiaryId === creatorId) {
                  const masterUser = users?.find(u => u.uid === creatorId || u.id === creatorId);
                  return masterUser ? (masterUser.displayName || masterUser.email) : 'Locador Master';
                }
                
                return landlords.length > 0 ? "Locador não encontrado" : undefined;
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
            {landlords.map((landlord) => (
              <SelectItem key={landlord.id} value={landlord.id}>
                {landlord.name}
              </SelectItem>
            ))}
            {landlords.length === 0 && (
              <SelectItem value="none" disabled>
                Nenhum locador cadastrado
              </SelectItem>
            )}
          </SelectContent>
        </Select>
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
        <div className="flex justify-between items-center bg-white/5 p-1.5 rounded-lg border border-white/5">
          <Label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Documentos do Contrato (Máx 5)</Label>
          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">
            {files.length + (formData.documentUrls?.length || 0)} / 5
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {/* File dropzone/button */}
          {(files.length + (formData.documentUrls?.length || 0) < 5) && (
            <div 
              onClick={() => document.getElementById('contractDocuments')?.click()}
              className="cursor-pointer border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/5 rounded-xl p-2.5 transition-all flex items-center gap-3 group hover:bg-white/10"
            >
              <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Upload className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate">
                  Clique para selecionar documentos do contrato
                </p>
                <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">PDF ou Imagem (Máx 5MB por arquivo)</p>
              </div>
              <input 
                id="contractDocuments"
                type="file" 
                className="hidden" 
                accept=".pdf,image/*" 
                multiple
                onChange={(e) => {
                  setFileError(null);
                  if (e.target.files) {
                    const selectedFiles = Array.from(e.target.files);
                    const currentTotal = files.length + (formData.documentUrls?.length || 0);
                    
                    if (currentTotal + selectedFiles.length > 5) {
                      toast.error('O limite padrão é de no máximo 5 documentos por contrato.');
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

          {/* Upload progress indicator */}
          {uploading && (
            <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enviando arquivos...</span>
                </div>
                <span className="text-2xl font-black text-white italic serif tracking-tighter">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
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

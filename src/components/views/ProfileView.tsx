import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Camera, 
  Settings, 
  Upload, 
  Info 
} from 'lucide-react';
import { 
  Card, 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase } from '../FirebaseProvider';
import { toast } from 'sonner';

interface ProfileViewProps {
  user: any;
}

export function ProfileView({ user }: ProfileViewProps) {
  const { updateUserProfile, updateUserPhoto, appLogo, updateAppLogo } = useFirebase();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('O nome é obrigatório');
      return;
    }
    setIsLoading(true);
    try {
      await updateUserProfile(name);
      toast.success('Dados cadastrais atualizados com sucesso!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);
    try {
      await updateUserPhoto(file);
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O logo deve ter no máximo 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      await updateAppLogo(file);
      toast.success('Logo do sistema atualizado!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b pb-8 border-white/10">
        <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Perfil do Usuário</h2>
        <p className="text-slate-400 font-medium mt-1">Gerencie suas informações de acesso e cadastro.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-10">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl rounded-3xl p-8 border">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="size-32 border-4 border-white/10 shadow-2xl mb-4 transition-transform group-hover:scale-105" key={user?.photoURL}>
                      <AvatarImage src={user?.photoURL || ''} referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-indigo-600 text-white font-bold text-3xl italic serif">
                        {name.substring(0, 2).toUpperCase() || 'AF'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full border-4 border-transparent">
                      {isUploading ? (
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="h-6 w-6 text-white mb-1" />
                          <span className="text-[8px] text-white font-bold uppercase tracking-tighter">Alterar Foto</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoUpload}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white serif italic mt-4">{name || 'Usuário'}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Locador Master</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail de Acesso</label>
                  <Input 
                    value={email}
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                    placeholder="seu@email.com"
                    disabled
                  />
                  <p className="text-[9px] text-slate-500 italic ml-1">* O e-mail não pode ser alterado por aqui por razões de segurança.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-center">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 rounded-xl shadow-xl shadow-indigo-500/20 transition-all uppercase tracking-widest text-[10px]"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {isAdmin && (
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl rounded-3xl p-8 border">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white serif italic">Identidade Visual</h3>
                  <p className="text-xs text-slate-400 font-medium">Personalize a marca da sua imobiliária.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer w-full max-w-[200px]" onClick={() => logoInputRef.current?.click()}>
                    <div className="aspect-square w-full bg-white/5 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/50 group-hover:bg-white/10">
                      {appLogo ? (
                        <img src={appLogo} alt="App Logo" className="w-[80%] h-[80%] object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-center p-6">
                          <Building2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nenhum logo configurado</p>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isUploadingLogo ? (
                          <div className="h-8 w-8 border-3 border-white/30 border-t-white animate-spin rounded-full"></div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-white mb-2" />
                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Substituir Logo</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <div className="mt-6 text-center">
                    <h4 className="text-sm font-bold text-white mb-1">Logo Principal</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Aparece na barra lateral e nos documentos.</p>
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-indigo-300/80 leading-relaxed">
                      Recomendamos o uso de logos com <strong>fundo transparente (PNG)</strong> e formato quadrado ou proporção equilibrada para melhor visualização na barra lateral.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

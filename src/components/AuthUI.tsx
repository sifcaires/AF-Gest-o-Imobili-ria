import React from 'react';
import { 
  Building2, 
  LogIn, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthUIProps {
  authMode: 'login' | 'register' | 'admin';
  setAuthMode: (mode: 'login' | 'register' | 'admin') => void;
  authData: any;
  setAuthData: (data: any) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  authLoading: boolean;
  authError: any;
}

export function AuthUI({ 
  authMode, 
  setAuthMode, 
  authData, 
  setAuthData, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  authLoading,
  authError 
}: AuthUIProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login' || authMode === 'admin') {
      signInWithEmail(authData.email, authData.password);
    } else {
      signUpWithEmail(authData.email, authData.password, authData.name);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-3xl shadow-2xl mb-6 shadow-indigo-500/20 transform hover:scale-105 transition-transform">
             <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter serif italic mb-2 uppercase tracking-tight">Aluga<span className="text-indigo-500">Fácil</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Arquitetando o futuro da gestão imobiliária</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-[40px] overflow-hidden">
          <CardHeader className="pt-10 px-10">
            <CardTitle className="text-2xl font-bold text-white serif italic">
              {authMode === 'login' ? 'Bem-vindo de volta' : authMode === 'admin' ? 'Acesso Administrativo' : 'Criar Nova Unidade'}
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              {authMode === 'login' ? 'Conecte-se para gerenciar seus ativos.' : authMode === 'admin' ? 'Insira suas credenciais mestras.' : 'Registre sua agência no ecossistema.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Razão Social / Nome</label>
                  <Input 
                    placeholder="Ex: Imobiliária Silva" 
                    className="bg-white/5 border-white/10 text-white h-12 rounded-2xl focus-visible:ring-indigo-500/50"
                    value={authData.name}
                    onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Profissional</label>
                <Input 
                  type="email"
                  placeholder="seu@contato.com" 
                  className="bg-white/5 border-white/10 text-white h-12 rounded-2xl focus-visible:ring-indigo-500/50"
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Senha de Segurança</label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  className="bg-white/5 border-white/10 text-white h-12 rounded-2xl focus-visible:ring-indigo-500/50 text-xl tracking-widest"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  required
                />
              </div>

              {authError && (
                 <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold leading-tight">
                   <AlertCircle className="h-4 w-4 shrink-0" />
                   <p>{authError}</p>
                 </div>
              )}

              <Button 
                type="submit"
                disabled={authLoading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform active:scale-95 uppercase tracking-widest text-xs"
              >
                {authLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {authMode === 'login' ? 'Conectar à Plataforma' : authMode === 'admin' ? 'Validar Credenciais' : 'Efetuar Cadastro'}
                  </div>
                )}
              </Button>

              {authMode === 'login' && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="bg-[#0f172a] px-4 text-slate-500">Ou continue com</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={signInWithGoogle}
                    className="w-full h-14 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-4 group"
                  >
                     <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                     <span className="text-[10px] uppercase tracking-widest">Acesso Rápido Google</span>
                  </Button>
                </>
              )}
            </form>

            <div className="mt-10 text-center space-y-4">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {authMode === 'login' ? (
                  <>Não possui conta? <span className="text-indigo-400">Crie agora</span></>
                ) : (
                  <>Já possui acesso? <span className="text-indigo-400">Faça login</span></>
                )}
              </button>
              
              <button 
                onClick={() => setAuthMode(authMode === 'admin' ? 'login' : 'admin')}
                className="block mx-auto text-[8px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors mt-6"
              >
                {authMode === 'admin' ? 'Voltar para login padrão' : 'Acesso Administrador'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-10 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          &copy; 2026 AlugaFácil Labs.<br/>
          Sistemas de Automação Imobiliária S.A.
        </p>
      </motion.div>
    </div>
  );
}

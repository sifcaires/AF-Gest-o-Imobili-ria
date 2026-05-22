import React from 'react';
import { 
  Building2, 
  LogIn, 
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from './ThemeProvider';

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
  appLogo?: string | null;
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
  authError,
  appLogo
}: AuthUIProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login' || authMode === 'admin') {
      signInWithEmail(authData.email, authData.password);
    } else {
      signUpWithEmail(authData.email, authData.password, authData.name);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Floating Theme Toggle in top-right */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full border border-slate-200 dark:border-white/10 shrink-0 transition-colors"
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-600" />
          )}
        </Button>
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.5 }}
         className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          {appLogo ? (
            <div className="inline-flex items-center justify-center p-1 bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl mb-4 shadow-indigo-500/10 transform hover:scale-105 transition-transform">
              <img src={appLogo} alt="Logo" className="h-16 w-16 object-contain rounded-xl" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-2xl mb-4 shadow-indigo-500/20 transform hover:scale-105 transition-transform">
               <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter serif italic mb-1 uppercase tracking-tight">Aluga<span className="text-indigo-500">Fácil</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Arquitetando o futuro da gestão imobiliária</p>
        </div>

        <Card className="border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-2xl rounded-[32px] overflow-hidden">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-white serif italic">
              {authMode === 'login' ? 'Bem-vindo de volta' : authMode === 'admin' ? 'Acesso Administrativo' : 'Criar Nova Unidade'}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs">
              {authMode === 'login' ? 'Conecte-se para gerenciar seus ativos.' : authMode === 'admin' ? 'Insira suas credenciais mestras.' : 'Registre sua agência no ecossistema.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Razão Social / Nome</label>
                  <Input 
                    placeholder="Ex: Imobiliária Silva" 
                    className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white h-12 rounded-2xl focus-visible:ring-indigo-500/50"
                    value={authData.name}
                    onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email Profissional</label>
                <Input 
                  type="email"
                  placeholder="seu@contato.com" 
                  className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white h-12 rounded-2xl focus-visible:ring-indigo-500/50"
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Senha de Segurança</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className={`bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white h-12 rounded-2xl focus-visible:ring-indigo-500/50 pr-12 ${showPassword ? 'text-sm tracking-normal' : 'text-xl tracking-widest'}`}
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1"
                    title={showPassword ? "Ocultar senha" : "Confirmar/Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                 <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 dark:text-rose-400 text-xs font-bold leading-tight">
                   <AlertCircle className="h-4 w-4 shrink-0" />
                   <p>{authError}</p>
                 </div>
              )}

              <Button 
                type="submit"
                disabled={authLoading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform active:scale-95 uppercase tracking-widest text-xs cursor-pointer"
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


            </form>

            <div className="mt-10 text-center space-y-4">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {authMode === 'login' ? (
                  <>Não possui conta? <span className="text-indigo-600 dark:text-indigo-400">Crie agora</span></>
                ) : (
                  <>Já possui acesso? <span className="text-indigo-600 dark:text-indigo-400">Faça login</span></>
                )}
              </button>
              
              <button 
                onClick={() => setAuthMode(authMode === 'admin' ? 'login' : 'admin')}
                className="block mx-auto text-[8px] font-bold text-slate-500 dark:text-slate-600 hover:text-slate-850 dark:hover:text-slate-400 uppercase tracking-widest transition-colors mt-6 cursor-pointer"
              >
                {authMode === 'admin' ? 'Voltar para login padrão' : 'Acesso Administrador'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-10 text-center text-slate-500 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          &copy; 2026 AlugaFácil Labs.<br/>
          Sistemas de Automação Imobiliária S.A.
        </p>
      </motion.div>
    </div>
  );
}

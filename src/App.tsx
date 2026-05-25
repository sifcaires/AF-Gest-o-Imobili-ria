import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  Plus,
  Search,
  Clock,
  MoreVertical,
  LogOut,
  Database,
  UserSquare2,
  User,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupLabel,
  SidebarInset, 
  SidebarTrigger,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

import { Property, Tenant, Contract, Payment, Landlord } from './types';
import { PropertyForm } from './components/PropertyForm';
import { TenantForm } from './components/TenantForm';
import { ContractForm } from './components/ContractForm';
import { PaymentForm } from './components/PaymentForm';
import { LandlordForm } from './components/LandlordForm';
import { useFirebase } from './components/FirebaseProvider';
import { useTheme } from './components/ThemeProvider';
import { getSafeDocumentUrl } from './lib/documentViewer';
import { useRealEstateData } from './hooks/useRealEstateData';
import { db } from './lib/firebase';

import { AuthUI } from './components/AuthUI';
import { DashboardView } from './components/views/DashboardView';
import { PropertiesView } from './components/views/PropertiesView';
import { TenantsView } from './components/views/TenantsView';
import { ContractsView } from './components/views/ContractsView';
import { PaymentsView } from './components/views/PaymentsView';
import { LandlordsView } from './components/views/LandlordsView';
import { ProfileView } from './components/views/ProfileView';
import { UsersView } from './components/views/UsersView';

type View = 'dashboard' | 'properties' | 'tenants' | 'contracts' | 'payments' | 'landlords' | 'profile' | 'users';

const chartData = [
  { name: 'Jan', total: 15000 },
  { name: 'Fev', total: 18000 },
  { name: 'Mar', total: 16500 },
  { name: 'Abr', total: 21000 },
  { name: 'Mai', total: 19000 },
  { name: 'Jun', total: 25000 },
];

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, logout, authError, updateUserProfile, updateEmail, appLogo } = useFirebase();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin' | 'forgot'>('login');
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  
  const handleLogout = async () => {
    setAuthData({ email: '', password: '', name: '' });
    setAuthMode('login');
    await logout();
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'none' | 'property' | 'tenant' | 'contract' | 'payment' | 'landlord'>('none');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'property' | 'tenant' | 'contract' | 'payment' | 'landlord' | 'user' } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    (window as any).__showDocumentPreview = (url: string, title?: string) => {
      setPreviewDoc({ url, title: title || 'Visualização do Documento' });
    };
    return () => {
      delete (window as any).__showDocumentPreview;
    };
  }, []);

  const {
    properties, tenants, contracts, payments, landlords, users, loading, isOperating,
    addProperty, updateProperty, deleteProperty,
    addTenant, updateTenant, deleteTenant,
    addContract, updateContract, deleteContract,
    addPayment, updatePayment, deletePayment,
    addLandlord, updateLandlord, deleteLandlord,
    updateUser, deleteUser,
    resetDatabase
  } = useRealEstateData(user);

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 animate-spin rounded-full"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthUI 
          authMode={authMode}
          setAuthMode={setAuthMode}
          authData={authData}
          setAuthData={setAuthData}
          signInWithGoogle={signInWithGoogle}
          signInWithEmail={signInWithEmail}
          signUpWithEmail={signUpWithEmail}
          sendPasswordReset={sendPasswordReset}
          authLoading={loading}
          authError={authError}
          appLogo={appLogo}
        />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const totalMonthlyIncome = properties
    .filter(p => p.status === 'rented')
    .reduce((acc, curr) => acc + curr.rentAmount, 0);

  const rentedPropertiesCount = properties.filter(p => p.status === 'rented').length;
  const occupancyRate = properties.length > 0
    ? Math.round((rentedPropertiesCount / properties.length) * 100)
    : 0;

  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;
  const overduePaymentsCount = payments.filter(p => p.status === 'overdue').length;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView 
          userName={user?.displayName || (user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com' ? 'Administrador' : 'Gestor')}
          stats={{
            income: totalMonthlyIncome,
            propertiesCount: properties.length,
            occupancyRate,
            tenantsCount: tenants.length,
            pendingPayments: pendingPaymentsCount,
            overduePayments: overduePaymentsCount
          }} 
          recentPayments={payments.slice(0, 5).map(payment => {
            const contract = contracts.find(c => c.id === payment.contractId);
            const tenant = contract ? tenants.find(t => t.id === contract.tenantId) : null;
            return {
              ...payment,
              tenantName: tenant ? tenant.name : undefined
            };
          })} 
          chartData={chartData}
        />;
      case 'properties':
        return <PropertiesView 
          properties={properties} 
          landlords={landlords}
          tenants={tenants}
          contracts={contracts}
          setSearchTerm={setSearchTerm} 
          searchTerm={searchTerm} 
          onEdit={(prop) => {
            setEditingItem(prop);
            setActiveForm('property');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'property' })}
        />;
      case 'tenants':
        return <TenantsView 
          tenants={tenants} 
          user={user}
          users={users}
          onEdit={(tenant) => {
            setEditingItem(tenant);
            setActiveForm('tenant');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'tenant' })}
        />;
      case 'contracts':
        return <ContractsView 
          contracts={contracts} 
          properties={properties} 
          tenants={tenants} 
          payments={payments}
          landlords={landlords}
          onEdit={(contract) => {
            setEditingItem(contract);
            setActiveForm('contract');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'contract' })}
        />;
      case 'payments':
        return <PaymentsView 
          payments={payments} 
          contracts={contracts} 
          tenants={tenants} 
          properties={properties} 
          landlords={landlords}
          onEdit={(payment) => {
            setEditingItem(payment);
            setActiveForm('payment');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'payment' })}
          onUpdatePayment={updatePayment}
        />;
      case 'landlords':
        return <LandlordsView 
          user={user}
          landlords={landlords} 
          users={users}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={(landlord) => {
            setEditingItem(landlord);
            setActiveForm('landlord');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'landlord' })}
          onRegisterMe={() => {
            setEditingItem({
              name: user.displayName || '',
              email: user.email || '',
              registeredBy: user.displayName || user.email || 'Locador Master',
            });
            setActiveForm('landlord');
            setIsRegistryOpen(true);
          }}
        />;
      case 'profile':
        return <ProfileView 
          user={user} 
          landlords={landlords}
          onRegisterAsLandlord={() => {
            setEditingItem({
              name: user.displayName || '',
              email: user.email || '',
              registeredBy: user.displayName || user.email || 'Locador Master',
            });
            setActiveForm('landlord');
            setIsRegistryOpen(true);
          }}
        />;
      case 'users':
        return <UsersView users={users} onUpdateUser={updateUser} onDeleteUser={(uid) => setItemToDelete({ id: uid, type: 'user' })} />;
      default:
        return <DashboardView 
          userName={user?.displayName || 'Gestor'}
          stats={{ income: 0, propertiesCount: 0, occupancyRate: 0, tenantsCount: 0, pendingPayments: 0, overduePayments: 0 }} 
          recentPayments={[]} 
          chartData={chartData}
        />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden font-sans relative transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#020617] z-0 transition-all duration-300"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 dark:bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none transition-all duration-300"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none transition-all duration-300"></div>

        <Sidebar className="border-r border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl z-10 transition-colors duration-300">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-4">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-16 w-16 object-contain rounded-2xl shadow-lg shadow-indigo-500/10 border border-slate-200/80 dark:border-white/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20 text-lg">
                  AF
                </div>
              )}
              <div>
                <h1 className="font-bold tracking-tight text-slate-800 dark:text-white text-base whitespace-nowrap">Portal AlugaFácil</h1>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gestão de Locação</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[13px] font-bold uppercase tracking-widest text-slate-500 mb-2">Painel de Controle</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('dashboard')} 
                    isActive={activeView === 'dashboard'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Visão Geral</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('profile')} 
                    isActive={activeView === 'profile'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <User className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Usuário</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {(user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('users')} 
                      isActive={activeView === 'users'}
                      className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                    >
                      <Users className="mr-3 h-5 w-5" />
                      <span className="font-medium text-sm">Usuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('landlords')} 
                    isActive={activeView === 'landlords'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <UserSquare2 className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Locadores</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('properties')} 
                    isActive={activeView === 'properties'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <Building2 className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Imóveis</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('tenants')} 
                    isActive={activeView === 'tenants'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <Users className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Inquilinos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('contracts')} 
                    isActive={activeView === 'contracts'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <FileText className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Contratos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('payments')} 
                    isActive={activeView === 'payments'}
                    className="h-11 px-4 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200/50 dark:hover:bg-white/5 data-[active=true]:bg-indigo-600/10 dark:data-[active=true]:bg-white/10 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-white rounded-lg"
                  >
                    <CreditCard className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Financeiro</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
              <Avatar className="size-9 border border-slate-200 dark:border-white/10 text-foreground" key={user?.photoURL}>
                <AvatarImage src={user?.photoURL || ''} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-white/10 text-white font-semibold text-xs">{user?.displayName?.substring(0, 2).toUpperCase() || 'AF'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-white truncate max-w-[120px]">{user?.displayName || ((user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com') ? 'Administrador' : 'Usuário')}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com') ? 'Diretor Geral' : 'Locador Master'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-slate-400">
                      <MoreVertical className="h-4 w-4 group-hover:text-white transition-colors" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48 frosted text-white border-white/10">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => setActiveView('profile')}
                      className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-xs font-bold uppercase tracking-widest"
                    >
                      Meu Perfil
                    </DropdownMenuItem>
                    {(user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com') && (
                      <DropdownMenuItem onClick={resetDatabase} className="hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer flex items-center gap-2 text-rose-400">
                        <Database className="h-4 w-4" />
                        Limpar Banco de Dados
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 cursor-pointer flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col bg-transparent z-10">
          <header className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-8 sticky top-0 bg-white/30 dark:bg-white/5 backdrop-blur-md z-10 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden text-slate-700 dark:text-white" />
              <div className="relative w-72 max-md:hidden items-center flex">
                 <Search className="absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                 <Input 
                   placeholder="Pesquisar..." 
                   className="pl-10 h-10 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-none rounded-full focus-visible:ring-indigo-500/50" 
                 />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isRegistryOpen} onOpenChange={(open) => {
                setIsRegistryOpen(open);
                if (!open) {
                  setActiveForm('none');
                  setEditingItem(null);
                }
              }}>
                <DialogTrigger
                  render={
                    <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all font-bold px-6 rounded-full text-xs uppercase tracking-wider">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Registro
                    </Button>
                  }
                />
                <DialogContent className={`${activeForm === 'none' ? 'sm:max-w-sm' : 'sm:max-w-2xl'} frosted border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 overflow-hidden ${(activeForm === 'tenant' || activeForm === 'payment') ? 'max-h-[min(780px,95vh)] md:h-[780px]' : 'max-h-[min(655px,90vh)] md:h-[655px]'} flex flex-col pl-[7px] pr-[10px] pt-0 pb-0 ml-0 -mt-[21px] mr-0 mb-0 border`}>
                  <DialogHeader className="h-[93px] pt-4 pb-4 pr-4 pl-[16px] ml-0 -mt-[8px] border-b border-slate-150 dark:border-white/5 flex flex-col justify-center shrink-0">
                    <DialogTitle className="serif text-xl md:text-2xl text-slate-800 dark:text-white">
                      {activeForm === 'none' ? 'Novo Cadastro' : 
                       activeForm === 'property' ? (editingItem ? 'Editar Imóvel' : 'Cadastrar Imóvel') : 
                       activeForm === 'tenant' ? (editingItem ? 'Editar Inquilino' : 'Cadastrar Inquilino') :
                       activeForm === 'contract' ? (editingItem ? 'Editar Contrato' : 'Cadastrar Contrato') :
                       activeForm === 'payment' ? (editingItem ? 'Editar Boleto' : 'Novo Boleto') :
                       activeForm === 'landlord' ? (editingItem ? 'Editar Locador' : 'Cadastro de Locador') :
                       'Novo Registro'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs truncate">
                      {activeForm === 'none' ? 'Selecione o tipo de registro que deseja criar no AlugaFácil.' : 
                       editingItem ? 'Atualize os dados do registro selecionado.' : 'Preencha os dados abaixo para salvar o novo registro.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="overflow-y-auto flex-1 pl-[16px] pr-4 -ml-[11px] -mr-[11px] -mt-[12px] -mb-[12px] pt-[3px] pb-[3px]">
                    {activeForm === 'none' ? (
                      <div className="grid grid-cols-2 gap-4 py-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveForm('property')}
                          className="h-28 flex-col gap-3 border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/50 text-white transition-all group"
                        >
                          <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20">
                            <Building2 className="h-5 w-5 text-indigo-400" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest">Imóvel</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveForm('tenant')}
                          className="h-28 flex-col gap-3 border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-white transition-all group"
                        >
                           <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                            <Users className="h-5 w-5 text-emerald-400" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest">Inquilino</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveForm('contract')}
                          className="h-28 flex-col gap-3 border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 text-white transition-all group"
                        >
                           <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20">
                            <FileText className="h-5 w-5 text-purple-400" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest">Contrato</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveForm('payment')}
                          className="h-28 flex-col gap-3 border-white/10 bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/50 text-white transition-all group"
                        >
                           <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
                            <CreditCard className="h-5 w-5 text-orange-400" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest">Boleto</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveForm('landlord')}
                          className="h-28 flex-col gap-3 border-white/10 bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 text-white transition-all group"
                        >
                           <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20">
                            <UserSquare2 className="h-5 w-5 text-blue-400" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest">Locador</span>
                        </Button>
                      </div>
                    ) : activeForm === 'property' ? (
                      <div key={editingItem?.id || 'new'}>
                        <PropertyForm 
                          initialData={editingItem} 
                          landlords={landlords}
                          onSubmit={editingItem ? async (data) => {
                            await updateProperty(editingItem.id, data);
                            setIsRegistryOpen(false);
                            setEditingItem(null);
                          } : async (data) => {
                            await addProperty(data);
                            setIsRegistryOpen(false);
                          }} 
                          isLoading={isOperating} 
                        />
                      </div>
                    ) : activeForm === 'tenant' ? (
                      <div key={editingItem?.id || 'new'}>
                        <TenantForm 
                          initialData={editingItem} 
                          onSubmit={editingItem ? async (data) => {
                            await updateTenant(editingItem.id, data);
                            setIsRegistryOpen(false);
                            setEditingItem(null);
                          } : async (data) => {
                            await addTenant(data);
                            setIsRegistryOpen(false);
                          }} 
                          isLoading={isOperating} 
                        />
                      </div>
                    ) : activeForm === 'contract' ? (
                      <div key={editingItem?.id || 'new'}>
                        <ContractForm 
                          initialData={editingItem} 
                          properties={properties} 
                          tenants={tenants} 
                          landlords={landlords}
                          users={users}
                          onSubmit={editingItem ? async (data) => {
                            await updateContract(editingItem.id, data);
                            setIsRegistryOpen(false);
                            setEditingItem(null);
                          } : async (data) => {
                            await addContract(data);
                            setIsRegistryOpen(false);
                          }} 
                          isLoading={isOperating} 
                        />
                      </div>
                    ) : activeForm === 'payment' ? (
                      <div key={editingItem?.id || 'new'}>
                        <PaymentForm 
                          initialData={editingItem} 
                          contracts={contracts} 
                          tenants={tenants} 
                          properties={properties} 
                          onSubmit={editingItem ? async (data) => {
                            await updatePayment(editingItem.id, data);
                            setIsRegistryOpen(false);
                            setEditingItem(null);
                          } : async (data) => {
                            await addPayment(data);
                            setIsRegistryOpen(false);
                          }} 
                          isLoading={isOperating} 
                        />
                      </div>
                    ) : activeForm === 'landlord' ? (
                      <div key={editingItem?.id || 'new'}>
                        <LandlordForm 
                          initialData={editingItem} 
                          currentUserName={user?.displayName || user?.email || 'Locador Master'}
                          onSubmit={(editingItem && editingItem.id) ? async (data) => {
                            await updateLandlord(editingItem.id, data);
                            setIsRegistryOpen(false);
                            setEditingItem(null);
                          } : async (data) => {
                            await addLandlord(data);
                            setIsRegistryOpen(false);
                          }} 
                          isLoading={isOperating} 
                        />
                      </div>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>

        <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <DialogContent className="sm:max-w-md frosted border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="serif italic text-2xl">Confirmar Exclusão</DialogTitle>
              <DialogDescription className="text-slate-400">
                Esta ação não pode ser desfeita. Deseja realmente remover este registro do sistema?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-6 pb-2">
              <Button 
                variant="ghost" 
                onClick={() => setItemToDelete(null)}
                className="text-slate-400 hover:bg-white/5 hover:text-white font-bold text-xs uppercase tracking-widest"
              >
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (!itemToDelete) return;
                  try {
                    if (itemToDelete.type === 'property') await deleteProperty(itemToDelete.id);
                    else if (itemToDelete.type === 'tenant') await deleteTenant(itemToDelete.id);
                    else if (itemToDelete.type === 'contract') await deleteContract(itemToDelete.id);
                    else if (itemToDelete.type === 'payment') await deletePayment(itemToDelete.id);
                    else if (itemToDelete.type === 'landlord') await deleteLandlord(itemToDelete.id);
                    else if (itemToDelete.type === 'user') await deleteUser(itemToDelete.id);
                    setItemToDelete(null);
                  } catch (error) {
                    console.error('[Delete Error]', error);
                  }
                }}
                disabled={isOperating}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest px-6 shadow-lg shadow-rose-900/20"
              >
                {isOperating ? 'Processando...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="sm:max-w-4xl w-[95vw] h-[85vh] max-h-[85vh] flex flex-col frosted border-white/10 text-white overflow-hidden p-0">
            <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-xl font-bold text-white pr-8 truncate">
                  Visualizar: {previewDoc?.title || 'Documento'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  Visualização protegida direta no sistema, sem baixar arquivo
                </DialogDescription>
              </div>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 bg-slate-950 p-4 flex items-center justify-center relative">
              {previewDoc && (
                (() => {
                  const url = previewDoc.url;
                  const isImg = url.startsWith('data:image/') || 
                    url.split('?')[0].toLowerCase().endsWith('.png') || 
                    url.split('?')[0].toLowerCase().endsWith('.jpg') || 
                    url.split('?')[0].toLowerCase().endsWith('.jpeg') || 
                    url.split('?')[0].toLowerCase().endsWith('.webp') || 
                    url.split('?')[0].toLowerCase().endsWith('.gif');

                  if (isImg) {
                    return (
                      <div className="w-full h-full flex items-center justify-center overflow-auto">
                        <img 
                          src={getSafeDocumentUrl(url)} 
                          alt={previewDoc.title || 'Documento'} 
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    );
                  }
                  
                  return (
                    <iframe 
                      src={`${getSafeDocumentUrl(url)}#toolbar=0`}
                      title={previewDoc.title || 'Documento'} 
                      className="w-full h-full rounded-lg border border-white/5 bg-slate-100"
                    />
                  );
                })()
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}

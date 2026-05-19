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
  LayoutDashboard
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

type View = 'dashboard' | 'properties' | 'tenants' | 'contracts' | 'payments' | 'landlords' | 'profile';

const chartData = [
  { name: 'Jan', total: 15000 },
  { name: 'Fev', total: 18000 },
  { name: 'Mar', total: 16500 },
  { name: 'Abr', total: 21000 },
  { name: 'Mai', total: 19000 },
  { name: 'Jun', total: 25000 },
];

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, authError, updateUserProfile, updateEmail, appLogo } = useFirebase();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'none' | 'property' | 'tenant' | 'contract' | 'payment' | 'landlord'>('none');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'property' | 'tenant' | 'contract' | 'payment' | 'landlord' } | null>(null);

  const {
    properties, tenants, contracts, payments, landlords, loading, isOperating,
    addProperty, updateProperty, deleteProperty,
    addTenant, updateTenant, deleteTenant,
    addContract, updateContract, deleteContract,
    addPayment, updatePayment, deletePayment,
    addLandlord, updateLandlord, deleteLandlord,
    resetDatabase
  } = useRealEstateData(user);

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
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
          authLoading={loading}
          authError={authError}
        />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const totalMonthlyIncome = properties
    .filter(p => p.status === 'rented')
    .reduce((acc, curr) => acc + curr.rentAmount, 0);

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
            tenantsCount: tenants.length,
            pendingPayments: pendingPaymentsCount,
            overduePayments: overduePaymentsCount
          }} 
          recentPayments={payments.slice(0, 5)} 
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
          onEdit={(payment) => {
            setEditingItem(payment);
            setActiveForm('payment');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'payment' })}
        />;
      case 'landlords':
        return <LandlordsView 
          landlords={landlords} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={(landlord) => {
            setEditingItem(landlord);
            setActiveForm('landlord');
            setIsRegistryOpen(true);
          }}
          onDelete={(id) => setItemToDelete({ id, type: 'landlord' })}
        />;
      case 'profile':
        return <ProfileView user={user} />;
      default:
        return <DashboardView 
          userName={user?.displayName || 'Gestor'}
          stats={{ income: 0, propertiesCount: 0, tenantsCount: 0, pendingPayments: 0, overduePayments: 0 }} 
          recentPayments={[]} 
          chartData={chartData}
        />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#020617] text-slate-100 overflow-hidden font-sans relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] z-0"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none"></div>

        <Sidebar className="border-r border-white/10 bg-white/5 backdrop-blur-xl z-10">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-10 w-10 object-contain rounded-xl" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/20 text-sm">
                  AF
                </div>
              )}
              <div>
                <h1 className="font-bold tracking-tight text-white text-sm whitespace-nowrap">Portal AF</h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{(user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com') ? 'Painel Administrativo' : 'Área do Locador'}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Painel de Controle</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('dashboard')} 
                    isActive={activeView === 'dashboard'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Visão Geral</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('profile')} 
                    isActive={activeView === 'profile'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <User className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Usuário</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('landlords')} 
                    isActive={activeView === 'landlords'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <UserSquare2 className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Locadores</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('properties')} 
                    isActive={activeView === 'properties'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <Building2 className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Imóveis</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('tenants')} 
                    isActive={activeView === 'tenants'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <Users className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Inquilinos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('contracts')} 
                    isActive={activeView === 'contracts'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <FileText className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Contratos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setActiveView('payments')} 
                    isActive={activeView === 'payments'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <CreditCard className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Financeiro</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-white/5 transition-colors group">
              <Avatar className="size-9 border border-white/10 text-slate-100" key={user?.photoURL}>
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
                    <DropdownMenuItem onClick={logout} className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 cursor-pointer flex items-center gap-2">
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
          <header className="flex h-16 items-center justify-between border-b border-white/10 px-8 sticky top-0 bg-white/5 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden text-white" />
              <div className="relative w-72 max-md:hidden items-center flex">
                 <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Pesquisar..." 
                   className="pl-10 h-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 transition-all shadow-none rounded-full focus-visible:ring-indigo-500/50" 
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
                <DialogContent className={`${activeForm === 'none' ? 'sm:max-w-md' : 'sm:max-w-lg'} frosted border-white/10 text-white overflow-hidden`}>
                  <DialogHeader className="p-4 border-b border-white/5">
                    <DialogTitle className="serif italic text-2xl text-white">
                      {activeForm === 'none' ? 'Novo Cadastro' : 
                       activeForm === 'property' ? (editingItem ? 'Editar Imóvel' : 'Cadastrar Imóvel') : 
                       activeForm === 'tenant' ? (editingItem ? 'Editar Inquilino' : 'Cadastrar Inquilino') :
                       activeForm === 'contract' ? (editingItem ? 'Editar Contrato' : 'Cadastrar Contrato') :
                       activeForm === 'payment' ? (editingItem ? 'Editar Recibo' : 'Novo Recibo') :
                       'Novo Registro'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {activeForm === 'none' ? 'Selecione o tipo de registro que deseja criar no AlugaFácil.' : 
                       editingItem ? 'Atualize os dados do registro selecionado.' : 'Preencha os dados abaixo para salvar o novo registro.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-4">
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
                          <span className="font-bold text-xs uppercase tracking-widest">Recibo</span>
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
                    ) : activeForm === 'tenant' ? (
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
                    ) : activeForm === 'contract' ? (
                      <ContractForm 
                        initialData={editingItem} 
                        properties={properties} 
                        tenants={tenants} 
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
                    ) : activeForm === 'payment' ? (
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
                    ) : activeForm === 'landlord' ? (
                      <LandlordForm 
                        initialData={editingItem} 
                        onSubmit={editingItem ? async (data) => {
                          await updateLandlord(editingItem.id, data);
                          setIsRegistryOpen(false);
                          setEditingItem(null);
                        } : async (data) => {
                          await addLandlord(data);
                          setIsRegistryOpen(false);
                        }} 
                        isLoading={isOperating} 
                      />
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto">
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
                onClick={() => {
                  if (!itemToDelete) return;
                  if (itemToDelete.type === 'property') deleteProperty(itemToDelete.id);
                  if (itemToDelete.type === 'tenant') deleteTenant(itemToDelete.id);
                  if (itemToDelete.type === 'contract') deleteContract(itemToDelete.id);
                  if (itemToDelete.type === 'payment') deletePayment(itemToDelete.id);
                  if (itemToDelete.type === 'landlord') deleteLandlord(itemToDelete.id);
                }}
                disabled={isOperating}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest px-6 shadow-lg shadow-rose-900/20"
              >
                {isOperating ? 'Processando...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  LayoutDashboard, 
  Plus,
  Search,
  Home,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileDown,
  LogIn,
  LogOut,
  Database,
  X,
  Trash2,
  UserSquare2,
  Pencil,
  User,
  Camera,
  ImagePlus,
  Settings,
  Upload,
  Info,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';

import { Property, Tenant, Contract, Payment, Landlord } from './types';
import { PropertyForm } from './components/PropertyForm';
import { TenantForm } from './components/TenantForm';
import { ContractForm } from './components/ContractForm';
import { PaymentForm } from './components/PaymentForm';
import { LandlordForm } from './components/LandlordForm';
import { mockProperties, mockTenants, mockContracts, mockPayments } from './mockData';
import { useFirebase } from './components/FirebaseProvider';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  doc,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './lib/firebase';

import { boletoService } from './services/boletoService';

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'none' | 'property' | 'tenant' | 'contract' | 'payment' | 'landlord'>('none');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'property' | 'tenant' | 'contract' | 'payment' | 'landlord' } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isAdmin = user.email === 'admin@email.com' || user.email === 'sifcaires@gmail.com';
      
      const qProperties = isAdmin 
        ? collection(db, 'properties') 
        : query(collection(db, 'properties'), where('ownerId', '==', user.uid));
        
      const qTenants = isAdmin 
        ? collection(db, 'tenants') 
        : query(collection(db, 'tenants'), where('ownerId', '==', user.uid));
        
      const qContracts = isAdmin 
        ? collection(db, 'contracts') 
        : query(collection(db, 'contracts'), where('ownerId', '==', user.uid));
        
      const qPayments = isAdmin 
        ? collection(db, 'payments') 
        : query(collection(db, 'payments'), where('ownerId', '==', user.uid));
        
      const qLandlords = isAdmin 
        ? collection(db, 'landlords') 
        : query(collection(db, 'landlords'), where('ownerId', '==', user.uid));

      const [sProp, sTen, sCon, sPay, sLand] = await Promise.all([
        getDocs(qProperties).catch(e => handleFirestoreError(e, OperationType.LIST, 'properties')),
        getDocs(qTenants).catch(e => handleFirestoreError(e, OperationType.LIST, 'tenants')),
        getDocs(qContracts).catch(e => handleFirestoreError(e, OperationType.LIST, 'contracts')),
        getDocs(qPayments).catch(e => handleFirestoreError(e, OperationType.LIST, 'payments')),
        getDocs(qLandlords).catch(e => handleFirestoreError(e, OperationType.LIST, 'landlords'))
      ]);

      setProperties(sProp?.docs?.map(d => ({ id: d.id, ...d.data() } as Property)) || []);
      setTenants(sTen?.docs?.map(d => ({ id: d.id, ...d.data() } as Tenant)) || []);
      setContracts(sCon?.docs?.map(d => ({ id: d.id, ...d.data() } as Contract)) || []);
      setPayments(sPay?.docs?.map(d => ({ id: d.id, ...d.data() } as Payment)) || []);
      setLandlords(sLand?.docs?.map(d => ({ id: d.id, ...d.data() } as Landlord)) || []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dados do Firebase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const resetDatabase = async () => {
    if (user?.email !== 'admin@email.com' && user?.email !== 'sifcaires@gmail.com') return;
    
    const confirmation = window.confirm('AVISO CRÍTICO: Você está prestes a LIMPAR TODO O BANCO DE DADOS. Esta ação é irreversível e excluirá todos os imóveis, inquilinos, contratos e pagamentos. Deseja prosseguir?');
    
    if (!confirmation) return;
    
    setLoading(true);
    try {
      const collectionsToReset = ['properties', 'tenants', 'contracts', 'payments', 'landlords'];
      
      for (const colName of collectionsToReset) {
        const q = collection(db, colName);
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) continue;
        
        // Firestore batches are limited to 500 operations
        const chunks = [];
        for (let i = 0; i < snapshot.docs.length; i += 500) {
          chunks.push(snapshot.docs.slice(i, i + 500));
        }
        
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
      }
      
      toast.success('Banco de dados redefinido com sucesso!');
      fetchData();
    } catch (e: any) {
      console.error('Erro ao resetar banco:', e);
      toast.error(`Falha ao limpar banco: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'properties', id));
      toast.success('Imóvel excluído com sucesso!');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `properties/${id}`);
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const updateProperty = async (id: string, data: Partial<Property>) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'properties', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Imóvel atualizado!');
      setEditingItem(null);
      setIsRegistryOpen(false);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `properties/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTenant = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'tenants', id));
      toast.success('Inquilino removido!');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tenants/${id}`);
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const updateTenant = async (id: string, data: Partial<Tenant>) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tenants', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Cadastro de inquilino atualizado!');
      setEditingItem(null);
      setIsRegistryOpen(false);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tenants/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteContract = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'contracts', id));
      toast.success('Contrato encerrado!');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `contracts/${id}`);
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const updateContract = async (id: string, data: Partial<Contract>) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'contracts', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Contrato atualizado!');
      setEditingItem(null);
      setIsRegistryOpen(false);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `contracts/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'payments', id));
      toast.success('Registro excluído!');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `payments/${id}`);
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'payments', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Pagamento atualizado!');
      setEditingItem(null);
      setIsRegistryOpen(false);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `payments/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteLandlord = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'landlords', id));
      toast.success('Locador removido!');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `landlords/${id}`);
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const updateLandlord = async (id: string, data: any) => {
    if (!user) return;
    setLoading(true);
    try {
      let finalData = { ...data };
      
      if (data.file) {
        const file = data.file as File;
        const storageRef = ref(storage, `landlords/${id}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        delete finalData.file;
        finalData.documentUrl = downloadURL;
      }

      await updateDoc(doc(db, 'landlords', id), {
        ...finalData,
        updatedAt: serverTimestamp()
      });
      toast.success('Cadastro de locador atualizado!');
      setEditingItem(null);
      setIsRegistryOpen(false);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `landlords/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async (data: Omit<Property, 'id'>) => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'properties'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Imóvel cadastrado com sucesso!');
      setIsRegistryOpen(false);
      setActiveForm('none');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'properties');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async (data: Omit<Tenant, 'id'>) => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'tenants'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Inquilino cadastrado com sucesso!');
      setIsRegistryOpen(false);
      setActiveForm('none');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async (data: Omit<Contract, 'id'>) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create the contract
      const contractRef = await addDoc(collection(db, 'contracts'), {
        ...data,
        ownerId: user.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Update property status to 'rented'
      const propertyRef = doc(db, 'properties', data.propertyId);
      await updateDoc(propertyRef, {
        status: 'rented',
        updatedAt: serverTimestamp()
      });

      toast.success('Contrato gerado com sucesso!');
      setIsRegistryOpen(false);
      setActiveForm('none');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (data: Omit<Payment, 'id'>) => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Recibo/Pagamento registrado com sucesso!');
      setIsRegistryOpen(false);
      setActiveForm('none');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLandlord = async (data: any) => {
    if (!user) return;
    setLoading(true);
    try {
      let finalData = { ...data };
      
      // Temporary ID for storage path if needed, or we add then update
      const landlordRef = doc(collection(db, 'landlords'));
      
      if (data.file) {
        const file = data.file as File;
        const storageRef = ref(storage, `landlords/${landlordRef.id}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        delete finalData.file;
        finalData.documentUrl = downloadURL;
      }

      const batch = writeBatch(db);
      batch.set(landlordRef, {
        ...finalData,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      toast.success('Locador cadastrado com sucesso!');
      setIsRegistryOpen(false);
      setActiveForm('none');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'landlords');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      mockProperties.forEach(p => {
        const ref = doc(collection(db, 'properties'), p.id);
        batch.set(ref, { ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      
      mockTenants.forEach(t => {
        const ref = doc(collection(db, 'tenants'), t.id);
        batch.set(ref, { ...t, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      mockContracts.forEach(c => {
        const ref = doc(collection(db, 'contracts'), c.id);
        batch.set(ref, { ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      mockPayments.forEach(p => {
        const ref = doc(collection(db, 'payments'), p.id);
        batch.set(ref, { ...p, ownerId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'batch-seed'));
      toast.success('Dados de demonstração populados com sucesso!');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao popular banco de dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full bg-[#020617] items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] z-0"></div>
        <Card className="w-full max-w-md frosted border-white/10 relative z-10 p-8 text-center space-y-6 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 font-bold text-white shadow-2xl shadow-indigo-500/20 text-xl">
              AF
            </div>
            <h1 className="text-3xl font-bold text-white serif italic">Portal do Locador</h1>
            <p className="text-slate-400 font-medium text-sm">
              {authMode === 'login' ? 'Entre na sua conta para gerenciar seus imóveis.' : 
               authMode === 'register' ? 'Comece a gerenciar seus imóveis hoje mesmo.' :
               'Acesso exclusivo para administradores.'}
            </p>
          </div>
          
          <div className="space-y-4">
            <form 
              className="space-y-4 text-left" 
              onSubmit={(e) => {
                e.preventDefault();
                if (authMode === 'register') {
                  signUpWithEmail(authData.email, authData.password, authData.name);
                } else {
                  signInWithEmail(authData.email, authData.password);
                }
              }}
            >
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                  <Input 
                    placeholder="Seu nome" 
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                    value={authData.name}
                    onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  {authMode === 'admin' ? 'E-mail Admin' : 'E-mail'}
                </label>
                <Input 
                  type="email"
                  placeholder={authMode === 'admin' ? 'admin@email.com' : "exemplo@email.com"} 
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  {authMode === 'admin' ? 'Senha Admin' : 'Senha'}
                </label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  required
                />
              </div>
              <Button 
                type="submit"
                className={`w-full h-12 ${authMode === 'admin' ? 'bg-slate-800 hover:bg-slate-700 font-serif italic' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold rounded-xl shadow-xl transition-all`}
              >
                {authMode === 'login' ? 'Entrar' : authMode === 'register' ? 'Cadastrar e Acessar' : 'Acessar Painel Master'}
              </Button>
            </form>

            <div className="flex flex-col gap-2 pt-2">
              {authMode === 'login' ? (
                <>
                  <p className="text-xs text-slate-400">
                    Não tem uma conta? {' '}
                    <button onClick={() => setAuthMode('register')} className="text-indigo-400 font-bold hover:underline">Cadastre-se</button>
                  </p>
                  <button onClick={() => setAuthMode('admin')} className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Acesso Administrativo</button>
                </>
              ) : authMode === 'register' ? (
                <p className="text-xs text-slate-400">
                  Já possui uma conta? {' '}
                  <button onClick={() => setAuthMode('login')} className="text-indigo-400 font-bold hover:underline">Entre aqui</button>
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-400">
                    Primeiro acesso administrativo? {' '}
                    <button onClick={() => setAuthMode('register')} className="text-indigo-400 font-bold hover:underline">Cadastre o Admin</button>
                  </p>
                  <button onClick={() => setAuthMode('login')} className="text-xs text-indigo-400 font-bold hover:underline">Voltar para login de Locador</button>
                </div>
              )}
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-medium text-left">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
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
          userName={user?.displayName || 'Gestor'}
          stats={{
            income: totalMonthlyIncome,
            propertiesCount: properties.length,
            tenantsCount: tenants.length,
            pendingPayments: pendingPaymentsCount,
            overduePayments: overduePaymentsCount
          }} 
          recentPayments={payments.slice(0, 5)}
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
                    onClick={() => setActiveView('profile')} 
                    isActive={activeView === 'profile'}
                    className="h-11 px-4 text-slate-400 transition-all hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white rounded-lg"
                  >
                    <User className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Usuário</span>
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
                    <DropdownMenuItem onClick={seedData} className="hover:bg-indigo-500/10 focus:bg-indigo-500/10 cursor-pointer flex items-center gap-2">
                      <Database className="h-4 w-4 text-indigo-400" />
                      Gerar Dados de Teste
                    </DropdownMenuItem>
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
                        onSubmit={editingItem ? (data) => updateProperty(editingItem.id, data) : handleAddProperty} 
                        isLoading={loading} 
                      />
                    ) : activeForm === 'tenant' ? (
                      <TenantForm 
                        initialData={editingItem} 
                        onSubmit={editingItem ? (data) => updateTenant(editingItem.id, data) : handleAddTenant} 
                        isLoading={loading} 
                      />
                    ) : activeForm === 'contract' ? (
                      <ContractForm 
                        initialData={editingItem} 
                        properties={properties} 
                        tenants={tenants} 
                        onSubmit={editingItem ? (data) => updateContract(editingItem.id, data) : handleAddContract} 
                        isLoading={loading} 
                      />
                    ) : activeForm === 'payment' ? (
                      <PaymentForm
                        initialData={editingItem} 
                        contracts={contracts}
                        tenants={tenants}
                        properties={properties}
                        onSubmit={editingItem ? (data) => updatePayment(editingItem.id, data) : handleAddPayment}
                        isLoading={loading}
                      />
                    ) : (
                      <LandlordForm
                        initialData={editingItem}
                        onSubmit={editingItem ? (data) => updateLandlord(editingItem.id, data) : handleAddLandlord}
                        isLoading={loading}
                      />
                    )}
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
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest px-6 shadow-lg shadow-rose-900/20"
              >
                {loading ? 'Processando...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}

function DashboardView({ userName, stats, recentPayments }: { userName: string, stats: any, recentPayments: Payment[] }) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 border-white/10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Olá, {userName.split(' ')[0]}</h2>
          <p className="text-slate-400 font-medium mt-1">
            {userName === 'Administrador' ? 'Visão global de todos os imóveis e locações do sistema.' : 'Este é o seu panorama operacional e financeiro.'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-full border border-white/10 backdrop-blur-md px-4">
          <Clock className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Atualizado: Agora</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Receita Mensal" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.income)} 
          subValue="+12% que mês anterior" 
          icon={<DollarSign className="h-4 w-4" />}
          color="blue"
          trend="up"
        />
        <StatCard 
          title="Imóveis Ativos" 
          value={stats.propertiesCount} 
          subValue="85% Taxa de ocupação" 
          icon={<Building2 className="h-4 w-4" />}
          color="purple"
        />
        <StatCard 
          title="Cobranças Pendentes" 
          value={stats.pendingPayments} 
          subValue="Vencendo nos próximos 5 dias" 
          icon={<Clock className="h-4 w-4" />}
          color="orange"
        />
        <StatCard 
          title="Inadimplência" 
          value={stats.overduePayments} 
          subValue="Crítico: Necessita atenção" 
          icon={<AlertCircle className="h-4 w-4" />}
          color="red"
          trend="down"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
          <CardHeader className="bg-white/5 border-b border-white/5 pb-6 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-tight serif italic text-2xl">Recebimentos Acumulados</CardTitle>
                <CardDescription className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Performance semestral das locações</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 shadow-sm flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={15}
                />
                <YAxis 
                  hide 
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '12px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}
                  labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md overflow-hidden flex flex-col shadow-2xl">
          <CardHeader className="bg-white/5 border-b border-white/5 pb-6 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-tight serif italic text-2xl">Pagamentos</CardTitle>
                <CardDescription className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Atividade Recente</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-indigo-400 hover:bg-white/10 border border-white/10 uppercase bg-transparent">Histórico</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="divide-y divide-white/5">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="p-5 hover:bg-white/5 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${
                      payment.status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      payment.status === 'overdue' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {payment.status === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">Recibo #{payment.id}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vence em: {new Date(payment.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white font-mono tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      payment.status === 'paid' ? 'text-emerald-400' :
                      payment.status === 'overdue' ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-white/5 border-t border-white/5">
            <Button variant="ghost" className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">Ver Relatório Completo</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color, trend }: { title: string, value: any, subValue: string, icon: any, color: string, trend?: 'up' | 'down' }) {
  const colors: Record<string, string> = {
    blue: 'bg-indigo-600 ring-indigo-500/20',
    purple: 'bg-purple-600 ring-purple-500/20',
    orange: 'bg-amber-500 ring-amber-500/20',
    red: 'bg-rose-600 ring-rose-500/20',
    emerald: 'bg-emerald-600 ring-emerald-500/20'
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden group shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white ${colors[color]} shadow-lg transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tighter text-white">{value}</div>
        <div className="flex items-center mt-2">
          {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-400 mr-1" />}
          <span className={`text-[11px] font-bold tracking-tight ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
            {subValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PropertiesView({ properties, landlords, tenants, contracts, searchTerm, setSearchTerm, onEdit, onDelete }: { 
  properties: Property[], 
  landlords: Landlord[],
  tenants: Tenant[],
  contracts: Contract[],
  searchTerm: string, 
  setSearchTerm: (s: string) => void,
  onEdit: (p: Property) => void,
  onDelete: (id: string) => void
}) {
  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 border-white/10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Imóveis</h2>
          <p className="text-slate-400 font-medium mt-1">
            Exibindo todos os imóveis registrados na plataforma.
          </p>
        </div>
        <div className="relative w-full md:w-96 flex">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Pesquisar por título ou endereço..." 
            className="pl-12 h-14 border-white/10 bg-white/5 text-white rounded-2xl shadow-xl shadow-slate-900/40 focus-visible:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => {
          const activeContract = contracts.find(c => c.propertyId === property.id && c.status === 'active');
          const currentTenant = tenants.find(t => t.id === activeContract?.tenantId);

          return (
            <Card key={property.id} className="overflow-hidden border-white/10 shadow-2xl backdrop-blur-md group hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-500 rounded-3xl bg-white/5 flex flex-col h-full border">
              <div className="relative h-64 w-full overflow-hidden">
                <img 
                  src={property.imageUrl} 
                  alt={property.title} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                />
                <div className="absolute top-6 right-6 flex gap-2 z-20">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(property.id);
                    }}
                    className="bg-rose-500/90 backdrop-blur-sm text-white hover:bg-rose-600 border-none h-9 w-9 rounded-xl shadow-xl transition-all hover:scale-110 active:scale-95"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                  <Badge className={
                    property.status === 'available' ? 'bg-emerald-500/80 text-white border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg' : 'bg-slate-900/80 text-white border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg'
                  }>
                    {property.status === 'available' ? 'Disponível' : 'Locado'}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-8 pb-3 text-white">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase italic serif">{property.title}</h3>
                  {landlords.find(l => l.id === property.landlordId) && (
                    <Badge variant="outline" className="border-white/20 text-slate-400 text-[9px] uppercase tracking-tighter">
                      Prop: {landlords.find(l => l.id === property.landlordId)?.name.split(' ')[0]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <Home className="h-3 w-3 text-slate-500 mt-1 shrink-0" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">{property.address}</p>
                </div>
              </CardHeader>
              <CardContent className="px-8 flex-1">
                <p className="text-sm text-slate-400 font-medium leading-relaxed italic line-clamp-3 mb-6">{property.description}</p>
                
                {property.status === 'rented' && currentTenant && (
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-3">
                    <User className="h-4 w-4 text-indigo-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inquilino Atual</p>
                      <p className="text-xs font-bold text-white">{currentTenant.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="px-8 py-8 mt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mensalidade</span>
                  <span className="text-2xl font-bold text-white font-mono tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.rentAmount)}
                  </span>
                </div>
                <Button 
                  onClick={() => onEdit(property)}
                  className="h-10 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg hover:shadow-indigo-500/25"
                >
                  Gerenciar
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TenantsView({ tenants, onEdit, onDelete }: { 
  tenants: Tenant[],
  onEdit: (t: Tenant) => void,
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10">
        <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Base de Inquilinos</h2>
        <p className="text-slate-400 font-medium mt-1">Gestão de perfis e histórico de locatários.</p>
      </div>

      <Card className="border-white/10 shadow-2xl backdrop-blur-md overflow-hidden bg-white/5 rounded-3xl border">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 px-10 text-slate-400">Locatário</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Documento</TableHead>
              <TableHead className="text-[10px) font-bold uppercase tracking-widest py-8 text-slate-400">Contato</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-right px-10 text-slate-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id} className="hover:bg-white/5 transition-all border-b border-white/5 group">
                <TableCell className="py-8 px-10">
                  <div className="flex items-center gap-5">
                    <Avatar className="h-14 w-14 border-4 border-white/10 shadow-xl">
                      <AvatarFallback className="bg-indigo-600 text-white font-bold text-lg italic serif">{tenant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-base tracking-tight">{tenant.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{tenant.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-400">{tenant.cpf}</TableCell>
                <TableCell className="text-sm font-bold text-slate-300 tracking-tight">{tenant.phone}</TableCell>
                <TableCell className="text-right px-10">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <Button 
                      variant="outline" 
                      onClick={() => onEdit(tenant)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:text-white hover:border-indigo-500/50 text-slate-400 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onDelete(tenant.id)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/20 text-rose-400 border hover:border-rose-500/50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ContractsView({ contracts, properties, tenants, onEdit, onDelete }: { 
  contracts: Contract[], 
  properties: Property[], 
  tenants: Tenant[],
  onEdit: (c: Contract) => void,
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Contratos de Locação</h2>
          <p className="text-slate-400 font-medium mt-1">Arquitetura jurídica das relações comerciais.</p>
        </div>
      </div>

      <div className="grid gap-10">
        {contracts.map(contract => {
          const property = properties.find(p => p.id === contract.propertyId);
          const tenant = tenants.find(t => t.id === contract.tenantId);
          
          return (
            <Card key={contract.id} className="border-white/10 shadow-2xl backdrop-blur-md bg-white/5 overflow-hidden rounded-[40px] relative group p-2 border">
              <div className="bg-white/5 rounded-[35px] border border-white/10 backdrop-blur-sm">
                <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                  <div>
                    <Badge className="bg-white/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-widest text-[9px] mb-4 shadow-sm px-3">Status: Ativo</Badge>
                    <CardTitle className="text-3xl font-bold text-white serif italic tracking-tight">Acordo #{contract.id}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Taxa de Locação</p>
                    <p className="text-4xl font-bold text-white font-mono tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.rentAmount)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <div className="grid md:grid-cols-3 gap-12 border-t border-white/5 pt-10 mt-4">
                    <div className="space-y-3">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20 shadow-inner">
                        <Building2 className="h-5 w-5 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Objeto do Contrato</span>
                      <p className="text-lg font-bold text-white tracking-tight leading-tight">{property?.title}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{property?.address}</p>
                    </div>
                    <div className="space-y-3">
                       <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5 border border-purple-500/20 shadow-inner">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Parte Locatária</span>
                      <p className="text-lg font-bold text-white tracking-tight">{tenant?.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documento: {tenant?.cpf}</p>
                    </div>
                    <div className="space-y-3">
                       <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5 border border-orange-500/20 shadow-inner">
                        <Clock className="h-5 w-5 text-orange-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Período de Vigência</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs bg-white/5 text-slate-300 border-white/10">{new Date(contract.startDate).toLocaleDateString()}</Badge>
                        <span className="text-slate-500 font-bold tracking-tighter">···</span>
                        <Badge variant="outline" className="font-mono text-xs bg-white/5 text-slate-300 border-white/10">{new Date(contract.endDate).toLocaleDateString()}</Badge>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Pagamento Mensal: DIA {contract.dayOfPayment}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 px-10 bg-white/5 rounded-b-[35px] border-t border-white/5 flex justify-between items-center">
                  <div className="flex gap-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => onDelete(contract.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 px-6 py-4 rounded-xl transition-all"
                    >
                      Excluir
                    </Button>
                    <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white/10 px-6 py-4 rounded-xl transition-all">Termos Aditivos</Button>
                  </div>
                  <Button 
                    onClick={() => onEdit(contract)}
                    className="h-12 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest bg-indigo-600 border-none hover:bg-indigo-700 transform hover:-translate-y-1 transition-all shadow-xl shadow-indigo-500/25 text-white"
                  >
                    Ajustar Termos
                  </Button>
                </CardFooter>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PaymentsView({ payments, contracts, tenants, properties, onEdit, onDelete }: { 
  payments: Payment[], 
  contracts: Contract[], 
  tenants: Tenant[], 
  properties: Property[],
  onEdit: (p: Payment) => void,
  onDelete: (id: string) => void
}) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const getTenantName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return 'N/A';
    const tenant = tenants.find(t => t.id === contract.tenantId);
    return tenant?.name || 'N/A';
  };

  const handleGenerateBoleto = async (payment: Payment) => {
    setIsGenerating(payment.id);
    try {
      const contract = contracts.find(c => c.id === payment.contractId);
      const tenant = tenants.find(t => t.id === contract?.tenantId);
      const property = properties.find(p => p.id === contract?.propertyId);

      if (!contract || !tenant || !property) {
        toast.error('Dados incompletos para gerar o boleto');
        return;
      }

      await boletoService.generateForPayment(payment, tenant, property);
      toast.success('Boleto gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao gerar boleto');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Módulo Financeiro</h2>
          <p className="text-slate-400 font-medium mt-1">Conciliação de faturas e controle de inadimplência.</p>
        </div>
        <div className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
           <Button variant="ghost" className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white/10 text-white hover:bg-white/20 transition-all">Todos</Button>
           <Button variant="ghost" className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all">Pendentes</Button>
           <Button variant="ghost" className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">Liquidados</Button>
        </div>
      </div>

      <Card className="border-white/10 shadow-2xl backdrop-blur-md bg-white/5 overflow-hidden rounded-3xl border">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 px-10 text-slate-400">Lançamento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Vencimento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Valor Bruto</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Status</TableHead>
              <TableHead className="text-right py-8 px-10 text-slate-400">Operações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-white/5 transition-all border-b border-white/5 group">
                <TableCell className="py-8 px-10 text-white">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm tracking-tight">{getTenantName(payment.contractId)}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cobrança Mensal #{payment.id}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-slate-400 italic">{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-lg font-bold text-white font-mono tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                </TableCell>
                <TableCell>
                  <Badge className={
                    payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10 font-bold px-4 py-1.5' : 
                    payment.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-500/10 font-bold px-4 py-1.5' : 
                    'bg-slate-900/50 text-white border-white/10 shadow-lg shadow-slate-900/50 font-bold px-4 py-1.5 border'
                  }>
                    {payment.status === 'paid' ? 'LIQUIDADO' : payment.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-10">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <Button 
                      variant="outline" 
                      onClick={() => onEdit(payment)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                    <Dialog open={!!selectedPayment && selectedPayment.id === payment.id} onOpenChange={(open) => !open && setSelectedPayment(null)}>
                      <DialogTrigger
                        render={
                          <Button 
                            className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest gap-3 shadow-xl shadow-indigo-500/25 transition-all"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <FileDown className="h-4 w-4" />
                            Boleto
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-white/10 shadow-2xl rounded-3xl frosted">
                        <div className="bg-indigo-600 text-white p-10 flex flex-col items-center gap-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 -translate-y-20"></div>
                          <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl scale-110">
                             <CreditCard className="h-10 w-10 text-white" />
                          </div>
                          <div className="text-center relative z-10">
                            <h3 className="text-3xl font-bold serif italic">Opções de Cobrança</h3>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Referente: {new Date(payment.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="p-10 space-y-8 bg-white/5">
                           <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-8">
                            <div>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Sacado</span>
                               <p className="text-lg font-bold text-white serif italic">{getTenantName(payment.contractId)}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Total Recibo</span>
                               <p className="text-2xl font-bold text-white font-mono tracking-tighter">
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                               </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-4 pt-6">
                            <Button 
                              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 uppercase tracking-widest text-[10px]"
                              onClick={() => handleGenerateBoleto(payment)}
                              disabled={isGenerating === payment.id}
                            >
                              {isGenerating === payment.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              Baixar PDF do Boleto
                            </Button>
                            <Button variant="ghost" className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest h-12 hover:bg-white/5 hover:text-white" onClick={() => setSelectedPayment(null)}>
                              Voltar ao Financeiro
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      onClick={() => onDelete(payment.id)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/10 text-rose-400 border hover:border-rose-500/50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function LandlordsView({ landlords, searchTerm, setSearchTerm, onEdit, onDelete }: { 
  landlords: Landlord[], 
  searchTerm: string,
  setSearchTerm: (s: string) => void,
  onEdit: (l: Landlord) => void,
  onDelete: (id: string) => void
}) {
  const [filterDoc, setFilterDoc] = useState<'all' | 'with' | 'without'>('all');

  const filteredLandlords = landlords.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.cpfCnpj.includes(searchTerm);
    
    if (filterDoc === 'with') return matchesSearch && !!l.documentUrl;
    if (filterDoc === 'without') return matchesSearch && !l.documentUrl;
    return matchesSearch;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-8 border-white/10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Locadores</h2>
          <p className="text-slate-400 font-medium mt-1">Gerenciamento de proprietários e beneficiários.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setFilterDoc('all')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterDoc === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterDoc('with')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterDoc === 'with' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Com Doc
            </button>
            <button 
              onClick={() => setFilterDoc('without')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterDoc === 'without' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sem Doc
            </button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Nome / Razão Social</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Contato</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Documento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Docus</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLandlords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <UserSquare2 className="h-10 w-10 text-slate-600" />
                    <p className="text-slate-500 font-medium">Nenhum locador encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLandlords.map((landlord) => (
              <TableRow key={landlord.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="py-5 px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 font-bold text-sm italic">
                        {landlord.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white tracking-tight text-lg">{landlord.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px] truncate">{landlord.address || 'Endereço não informado'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <p className="text-sm font-medium text-slate-300">{landlord.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-slate-500" />
                      <p className="text-xs text-slate-500">{landlord.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-8">
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300 font-mono text-[10px] px-3 py-1">{landlord.cpfCnpj}</Badge>
                </TableCell>
                <TableCell className="py-5 px-8">
                  {landlord.documentUrl ? (
                    <a 
                      href={landlord.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105"
                    >
                      <FileText className="h-3 w-3" />
                      Ver
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Pendente</span>
                  )}
                </TableCell>
                <TableCell className="py-5 px-8 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      onClick={() => onEdit(landlord)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onDelete(landlord.id)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/10 text-rose-400 border hover:border-rose-500/50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ProfileView({ user }: { user: any }) {
  const { updateUserProfile, updateUserPhoto, appLogo, updateAppLogo } = useFirebase();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const isAdmin = user?.email === 'admin@email.com' || user?.email === 'sifcaires@gmail.com';

  const handleUpdateProfile = async (e: any) => {
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

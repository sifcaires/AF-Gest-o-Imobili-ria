import { useState } from 'react';
import { 
  Search, 
  UserSquare2, 
  Mail, 
  Phone, 
  Pencil, 
  Trash2,
  Percent,
  CreditCard
} from 'lucide-react';
import { 
  Card, 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Broker, AppUser, Property } from '../../types';

interface BrokersViewProps {
  user: any;
  brokers: Broker[];
  properties: Property[];
  users?: AppUser[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onEdit: (b: Broker) => void;
  onDelete: (id: string) => void;
}

export function BrokersView({ user, brokers, properties, users, searchTerm, setSearchTerm, onEdit, onDelete }: BrokersViewProps) {
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'low' | 'high'>('all');

  const getPhoto = (email: string) => {
    if (email?.toLowerCase() === user?.email?.toLowerCase() && user?.photoURL) {
      return user.photoURL;
    }
    const found = users?.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    return found?.photoURL || null;
  };

  const filteredBrokers = brokers.filter(b => {
    const s = (searchTerm || '').toLowerCase();
    const matchesSearch = (b.name || '').toLowerCase().includes(s) ||
      (b.email || '').toLowerCase().includes(s) ||
      (b.creci || '').toLowerCase().includes(s);
    
    if (commissionFilter === 'low') return matchesSearch && (b.commissionPercent || 0) <= 10;
    if (commissionFilter === 'high') return matchesSearch && (b.commissionPercent || 0) > 10;
    return matchesSearch;
  });

  return (
    <div id="brokers-view" className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-8 border-white/10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Corretores</h2>
          <p className="text-slate-400 font-medium mt-1">Gerenciamento de corretores de imóveis credenciados.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setCommissionFilter('all')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${commissionFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setCommissionFilter('low')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${commissionFilter === 'low' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Até 10%
            </button>
            <button 
              onClick={() => setCommissionFilter('high')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${commissionFilter === 'high' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Mais de 10%
            </button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Buscar por nome, e-mail, CRECI..." 
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
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Corretor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">CRECI</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Contato</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Captações</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Comissão</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Chave PIX</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrokers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <UserSquare2 className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum corretor encontrado</p>
                      <p className="text-slate-600 text-[10px] mt-1">Cadastre um profissional ou mude seu termo de busca.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBrokers.map((broker) => (
              <TableRow key={broker.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="py-5 px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                      {getPhoto(broker.email) && (
                        <AvatarImage src={getPhoto(broker.email) || ''} referrerPolicy="no-referrer" />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 font-bold text-sm italic">
                        {(broker.name || 'C').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white tracking-tight text-lg">{broker.name}</p>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Membro Ativo</p>
                        {broker.registeredBy && (
                          <p className="text-[9px] text-indigo-400 font-medium font-mono">Por: {broker.registeredBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-8">
                  <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-mono text-[10px] px-3 py-1">
                    CRECI {broker.creci}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <p className="text-sm font-medium text-slate-300">{broker.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-slate-500" />
                      <p className="text-xs text-slate-500">{broker.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-8">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="border-teal-500/20 bg-teal-500/10 text-teal-300 text-xs font-bold px-3 py-1.5 rounded-lg w-max flex items-center gap-1.5">
                      <span className="text-[11px]">🏠</span>
                      <span>
                        {properties.filter(p => p.capturedByBrokerId === broker.id).length} Captações
                      </span>
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-8">
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <Percent className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>{broker.commissionPercent}%</span>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-8">
                  {broker.pixKey ? (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]" title={broker.pixKey}>
                        {broker.pixKey}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Não informada</span>
                  )}
                </TableCell>
                <TableCell className="py-5 px-8 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      onClick={() => onEdit(broker)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                      title="Editar Corretor"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onDelete(broker.id)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/10 text-rose-400 border hover:border-rose-500/50 transition-colors"
                      title="Excluir Corretor"
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

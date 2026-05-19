import React from 'react';
import { 
  Users as UsersIcon, 
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Mail,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppUser } from '../../types';

interface UsersViewProps {
  users: AppUser[];
}

export function UsersView({ users }: UsersViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s) ||
      u.role?.toLowerCase().includes(s)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
              <UsersIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-4xl font-bold text-white serif italic tracking-tight">Gestão de Usuários</h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md font-medium">
            Visualize e monitore os acessos ao Portal AlugaFácil. Restrito ao Diretor Geral.
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <Input 
            placeholder="Pesquisar usuários..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-indigo-500/50 transition-all shadow-inner" 
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/10 h-16">
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] pl-8">Usuário</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Papel / Acesso</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data de Cadastro</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Último Login</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-right pr-8">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <UsersIcon className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário encontrado</p>
                      <p className="text-slate-600 text-[10px] mt-1">Refine sua busca para encontrar o colaborador.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.uid} className="hover:bg-white/5 border-white/5 group transition-colors h-20">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg group-hover:border-indigo-500/30 transition-all">
                        <AvatarImage src={u.photoURL || ''} />
                        <AvatarFallback className="bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                          {u.displayName?.substring(0, 2).toUpperCase() || 'AF'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-bold text-sm truncate">{u.displayName || 'Usuário Sem Nome'}</span>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.role === 'director' ? (
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3" />
                          Diretor Geral
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3" />
                          Locador Master
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{formatDate(u.createdAt).split(',')[0]}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{formatDate(u.lastLogin)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Ativo</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

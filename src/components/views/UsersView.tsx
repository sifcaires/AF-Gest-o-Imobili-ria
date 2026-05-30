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
  ExternalLink,
  Pencil,
  Trash2
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppUser } from '../../types';
import { useFirebase } from '../FirebaseProvider';

interface UsersViewProps {
  users: AppUser[];
  onUpdateUser?: (uid: string, data: Partial<AppUser>) => Promise<any>;
  onDeleteUser?: (uid: string) => Promise<any>;
}

export function UsersView({ users, onUpdateUser, onDeleteUser }: UsersViewProps) {
  const { user } = useFirebase();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingUser, setEditingUser] = React.useState<AppUser | null>(null);
  const [editedName, setEditedName] = React.useState('');
  const [editedRole, setEditedRole] = React.useState<'director' | 'landlord' | 'landlord_pleno' | 'broker'>('landlord');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleStartEdit = (u: AppUser) => {
    setEditingUser(u);
    setEditedName(u.displayName || '');
    setEditedRole(u.role || 'landlord');
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !onUpdateUser) return;
    setIsSaving(true);
    try {
      await onUpdateUser(editingUser.uid, {
        displayName: editedName,
        role: editedRole
      });
      setEditingUser(null);
    } catch (e) {
      console.error('[SaveUserEdit Error]', e);
    } finally {
      setIsSaving(false);
    }
  };

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
              <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
              {(onUpdateUser || onDeleteUser) && (
                <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-right pr-8">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onUpdateUser || onDeleteUser ? 6 : 5} className="h-64 text-center">
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
                      ) : u.role === 'landlord_pleno' ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
                          <UserCheck className="h-3 w-3" />
                          Locador Pleno
                        </Badge>
                      ) : u.role === 'broker' ? (
                        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 font-bold uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <Shield className="h-3 w-3" />
                          Corretor (Restrito)
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
                  <TableCell>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Ativo</span>
                    </div>
                  </TableCell>
                  {(onUpdateUser || onDeleteUser) && (
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onUpdateUser && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleStartEdit(u)}
                            className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                            title="Editar Usuário"
                          >
                            <Pencil className="h-4 w-4 text-indigo-300" />
                          </Button>
                        )}
                        {onDeleteUser && (u.role === 'landlord' || (user?.role === 'director' && (u.role === 'landlord_pleno' || u.role === 'broker'))) && (
                          <Button 
                            variant="outline" 
                            onClick={() => onDeleteUser(u.uid)}
                            className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/10 text-rose-400 border hover:border-rose-500/50 transition-colors"
                            title={u.role === 'landlord_pleno' ? "Excluir Locador Pleno" : u.role === 'broker' ? "Excluir Corretor" : "Excluir Locador Master"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-md bg-[#0a0f1d] border border-white/10 text-white rounded-3xl overflow-hidden p-0 shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 animate-pulse"></div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="serif italic text-2xl text-white">Editar Usuário</DialogTitle>
                <DialogDescription className="text-indigo-200/90 mt-1 text-xs font-semibold">
                  Altere as credenciais e nível de acesso do colaborador.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome de Exibição</Label>
                <Input 
                  value={editedName} 
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Nome Completo"
                  className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-indigo-500/50 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Papel / Perfil de Acesso</Label>
                <div className="relative">
                  <select
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value as 'director' | 'landlord' | 'landlord_pleno' | 'broker')}
                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="director" className="bg-[#0a0f1d] text-white font-bold">Diretor Geral (Acesso Pleno)</option>
                    <option value="landlord" className="bg-[#0a0f1d] text-white">Locador Master (Acesso Restrito)</option>
                    <option value="landlord_pleno" className="bg-[#0a0f1d] text-white">Locador Pleno (Somente Visualização)</option>
                    <option value="broker" className="bg-[#0a0f1d] text-white">Corretor (Acesso Restrito)</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t border-white/5 bg-white/5 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="h-11 px-5 border-white/10 bg-transparent hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

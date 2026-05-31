import React, { useState } from 'react';
import { 
  FileText, 
  Trash2 
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tenant, AppUser } from '../../types';

interface TenantsViewProps {
  tenants: Tenant[];
  user?: any;
  users?: AppUser[];
  onEdit: (t: Tenant) => void;
  onDelete: (id: string) => void;
}

export function TenantsView({ tenants, user, users, onEdit, onDelete }: TenantsViewProps) {
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const getPhoto = (email: string) => {
    if (email?.toLowerCase() === user?.email?.toLowerCase() && user?.photoURL) {
      return user.photoURL;
    }
    const found = users?.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    return found?.photoURL || null;
  };

  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10">
        <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Base de Inquilinos</h2>
        <p className="text-slate-400 font-medium mt-1">Gestão de perfis e histórico de locatários.</p>
      </div>

      <Card className="border-white/10 shadow-2xl backdrop-blur-md overflow-hidden bg-white/5 rounded-3xl border">
        <div className="overflow-x-auto w-full">
          <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 px-10 text-slate-400">Locatário</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">CPF/CNPJ</TableHead>
               <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Contato</TableHead>
              {user?.role !== 'landlord_pleno' && (
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-right px-10 text-slate-400">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id} className="hover:bg-white/5 transition-all border-b border-white/5 group">
                <TableCell className="py-8 px-10">
                  <div className="flex items-center gap-5">
                    <Avatar className="h-14 w-14 border-4 border-white/10 shadow-xl">
                      {getPhoto(tenant.email) && (
                        <AvatarImage src={getPhoto(tenant.email) || ''} referrerPolicy="no-referrer" />
                      )}
                      <AvatarFallback className="bg-indigo-600 text-white font-bold text-lg italic serif">{(tenant.name || 'I').substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-base tracking-tight">{tenant.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{tenant.email}</span>
                      {tenant.address && (
                        <span className="text-[10px] text-slate-400 mt-1 max-w-[250px] truncate">📍 {tenant.address}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-400">{tenant.cpf}</TableCell>
                <TableCell className="text-sm font-bold text-slate-300 tracking-tight">{tenant.phone}</TableCell>
                <TableCell className="text-right px-10">
                  {user?.role !== 'landlord_pleno' && (
                    <div className="flex justify-end gap-3 lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-all lg:translate-x-4 lg:group-hover:translate-x-0 translate-x-0">
                      {user?.role === 'broker' ? (
                        <div className="flex items-center gap-3 justify-end">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-teal-400 bg-teal-400/10 px-3 py-1.5 rounded-lg border border-teal-400/20">Visualização</span>
                          <Button 
                            variant="outline" 
                            onClick={() => onEdit(tenant)}
                            className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:text-white hover:border-indigo-500/50 text-slate-400 transition-colors"
                            title="Visualizar Detalhes"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => onEdit(tenant)}
                            className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:text-white hover:border-indigo-500/50 text-slate-400 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setTenantToDelete(tenant)}
                            className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/20 text-rose-400 border hover:border-rose-500/50 transition-colors"
                            title="Excluir Inquilino"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      {tenantToDelete && (
        <Dialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
          <DialogContent className="sm:max-w-md bg-[#0a0f1d] border border-white/10 text-white rounded-3xl overflow-hidden p-0 shadow-2xl">
            <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 animate-pulse"></div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="serif italic text-2xl text-white">Confirmar Exclusão</DialogTitle>
                <DialogDescription className="text-rose-100/90 mt-1 text-xs font-semibold">
                  Esta ação não pode ser desfeita e removerá os dados do registro.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-300">
                Você tem certeza que deseja excluir o inquilino <span className="font-bold text-white">{tenantToDelete.name}</span>?
              </p>
              
              <DialogFooter className="flex gap-2 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setTenantToDelete(null)}
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    onDelete(tenantToDelete.id);
                    setTenantToDelete(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  Confirmar Exclusão
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

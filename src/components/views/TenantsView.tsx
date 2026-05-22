import React from 'react';
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
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 px-10 text-slate-400">Locatário</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">CPF/CNPJ</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Contato</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-right px-10 text-slate-400">Ações</TableHead>
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

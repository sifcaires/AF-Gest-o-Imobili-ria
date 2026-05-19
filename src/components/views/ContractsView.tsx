import React from 'react';
import { 
  Building2, 
  Users, 
  Clock 
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contract, Property, Tenant } from '../../types';

interface ContractsViewProps {
  contracts: Contract[];
  properties: Property[];
  tenants: Tenant[];
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
}

export function ContractsView({ contracts, properties, tenants, onEdit, onDelete }: ContractsViewProps) {
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

import React from 'react';
import { 
  Search, 
  Home, 
  Trash2, 
  User 
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Property, Landlord, Tenant, Contract } from '../../types';

interface PropertiesViewProps {
  properties: Property[];
  landlords: Landlord[];
  tenants: Tenant[];
  contracts: Contract[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  user?: any;
}

export function PropertiesView({ 
  properties, 
  landlords, 
  tenants, 
  contracts, 
  searchTerm, 
  setSearchTerm, 
  onEdit, 
  onDelete,
  user
}: PropertiesViewProps) {
  const filteredProperties = properties.filter(p => 
    (p.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (p.address || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-white/10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white serif italic">Imóveis</h2>
          <p className="text-slate-400 font-medium mt-1 text-xs">
            Exibindo todos os imóveis registrados na plataforma.
          </p>
        </div>
        <div className="relative w-full md:w-80 flex">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input 
            placeholder="Pesquisar por título ou endereço..." 
            className="pl-11 h-11 border-white/10 bg-white/5 text-white rounded-xl shadow-xl shadow-slate-900/40 focus-visible:ring-indigo-500/50 transition-all text-xs font-bold placeholder:text-slate-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => {
          const activeContract = contracts.find(c => c.propertyId === property.id && c.status === 'active');
          const currentTenant = tenants.find(t => t.id === activeContract?.tenantId);

          return (
            <Card key={property.id} className="overflow-hidden border-white/10 shadow-2xl backdrop-blur-md group hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-500 rounded-2xl bg-white/5 flex flex-col h-full border">
              <div className="relative h-44 w-full overflow-hidden">
                <img 
                  referrerPolicy="no-referrer"
                  src={property.imageUrl} 
                  alt={property.title} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                />
                <div className="absolute top-4 right-4 z-20">
                  <Badge className={
                    property.status === 'available' ? 'bg-emerald-500/80 text-white border-none font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 shadow-lg' : 'bg-slate-900/80 text-white border-none font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 shadow-lg'
                  }>
                    {property.status === 'available' ? 'Disponível' : 'Locado'}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-1.5 text-white">
                {landlords.find(l => l.id === property.landlordId) && (
                  <div className="mb-1.5">
                    <Badge variant="outline" className="border-white/10 text-indigo-400 dark:text-indigo-300 text-[8px] uppercase tracking-tighter font-semibold">
                      Prop: {landlords.find(l => l.id === property.landlordId)?.name || 'N/A'}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-[13px] leading-[14px] font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors uppercase italic serif truncate flex-1 min-w-0">{property.title}</h3>
                </div>
                <div className="flex items-start gap-1.5 mt-1">
                  <Home className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{property.address}</p>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-2.5 flex-1">
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-2 mb-2">{property.description}</p>
                
                {/* Taxas Adicionais */}
                <div className="grid grid-cols-3 gap-1.5 mb-2.5 border-t border-b border-white/5 py-2">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Aluguel</p>
                    <p className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.rentAmount)}
                    </p>
                  </div>
                  {property.condoAmount && property.condoAmount > 0 ? (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Condomínio</p>
                      <p className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.condoAmount)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Condomínio</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Incluso</p>
                    </div>
                  )}
                  {property.iptuAmount && property.iptuAmount > 0 ? (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">IPTU Mensal</p>
                      <p className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.iptuAmount)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">IPTU Mensal</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Incluso / Isento</p>
                    </div>
                  )}
                </div>

                {/* Exigências / Garantias */}
                {(property.requiresGuarantor || property.requiresDeposit || property.requiresInsurance) ? (
                  <div className="flex w-full gap-1.5 mb-2.5">
                    {property.requiresGuarantor && (
                      <Badge variant="outline" className="flex-1 w-full justify-center text-center border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-[9px] uppercase font-bold py-1 px-1.5 rounded-lg gap-1">
                        <span>🛡️ Fiador</span>
                      </Badge>
                    )}
                    {property.requiresDeposit && (
                      <Badge variant="outline" className="flex-1 w-full justify-center text-center border-amber-500/20 bg-amber-500/5 text-amber-300 text-[9px] uppercase font-bold py-1 px-1.5 rounded-lg gap-1">
                        <span>💵 Caução</span>
                      </Badge>
                    )}
                    {property.requiresInsurance && (
                      <Badge variant="outline" className="flex-1 w-full justify-center text-center border-purple-500/20 bg-purple-500/5 text-purple-300 text-[9px] uppercase font-bold py-1 px-1.5 rounded-lg gap-1">
                        <span>🛡️ Seguro</span>
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    <Badge variant="outline" className="border-emerald-500/10 bg-emerald-500/5 text-emerald-400 text-[9px] uppercase font-bold py-0.5 px-1.5 rounded-lg">
                      <span>✓ Sem Garantia</span>
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-2 mt-1">
                  {property.status === 'rented' && currentTenant ? (
                    <div 
                      className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-2 flex-1 min-w-0"
                      style={{ paddingLeft: '7px', paddingTop: '8px', paddingBottom: '8px', paddingRight: '8px', marginLeft: '0px' }}
                    >
                      <User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Inquilino Atual</p>
                        <p className="text-xs font-bold text-white truncate mt-0.5">{currentTenant.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {user?.role !== 'landlord_pleno' && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(property.id);
                      }}
                      className="bg-rose-500/90 backdrop-blur-sm text-white hover:bg-rose-600 border-none h-8 w-8 rounded-lg shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-4 py-3 mt-auto border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pacote Mensal</span>
                  <span className="text-[17px] font-bold text-white font-mono tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      property.rentAmount + (property.condoAmount || 0) + (property.iptuAmount || 0)
                    )}
                  </span>
                  {(property.condoAmount || property.iptuAmount) ? (
                    <span className="text-[8px] text-slate-400 font-medium">Aluguel + Taxas</span>
                  ) : (
                    <span className="text-[8px] text-slate-400 font-medium">Apenas aluguel</span>
                  )}
                </div>
                {user?.role !== 'landlord_pleno' && (
                  <Button 
                    onClick={() => onEdit(property)}
                    className="h-8 px-4 rounded-full font-bold text-[10px] uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg hover:shadow-indigo-500/25"
                  >
                    Gerenciar
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

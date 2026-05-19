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
}

export function PropertiesView({ 
  properties, 
  landlords, 
  tenants, 
  contracts, 
  searchTerm, 
  setSearchTerm, 
  onEdit, 
  onDelete 
}: PropertiesViewProps) {
  const filteredProperties = properties.filter(p => 
    (p.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (p.address || '').toLowerCase().includes((searchTerm || '').toLowerCase())
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
                  referrerPolicy="no-referrer"
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
                      Prop: {landlords.find(l => l.id === property.landlordId)?.name?.split(' ')[0] || 'N/A'}
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

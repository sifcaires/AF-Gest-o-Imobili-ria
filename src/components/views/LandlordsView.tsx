import React, { useState } from 'react';
import { 
  Search, 
  UserSquare2, 
  Mail, 
  Phone, 
  FileText, 
  Pencil, 
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Landlord, AppUser } from '../../types';
import { getSafeDocumentUrl, viewDocumentSecurely } from '../../lib/documentViewer';

interface LandlordsViewProps {
  user: any;
  landlords: Landlord[];
  users?: AppUser[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onEdit: (l: Landlord) => void;
  onDelete: (id: string) => void;
  onRegisterMe: () => void;
}

export function LandlordsView({ user, landlords, users, searchTerm, setSearchTerm, onEdit, onDelete, onRegisterMe }: LandlordsViewProps) {
  const [filterDoc, setFilterDoc] = useState<'all' | 'with' | 'without'>('all');
  const isAlreadyLandlord = landlords.some(l => l.email === user?.email);

  const getPhoto = (email: string) => {
    if (email?.toLowerCase() === user?.email?.toLowerCase() && user?.photoURL) {
      return user.photoURL;
    }
    const found = users?.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    return found?.photoURL || null;
  };

  const filteredLandlords = landlords.filter(l => {
    const s = (searchTerm || '').toLowerCase();
    const matchesSearch = (l.name || '').toLowerCase().includes(s) ||
      (l.email || '').toLowerCase().includes(s) ||
      (l.cpfCnpj || '').includes(searchTerm || '');
    
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
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">CPF/CNPJ</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Documentos</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLandlords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <UserSquare2 className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum locador encontrado</p>
                      <p className="text-slate-600 text-[10px] mt-1">Refine sua busca ou adicione um novo registro.</p>
                    </div>
                    {!isAlreadyLandlord && user?.role !== 'broker' && (
                      <Button 
                        onClick={onRegisterMe}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 font-bold text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all"
                      >
                        Me cadastrar como Locador
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLandlords.map((landlord) => (
              <TableRow key={landlord.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="py-5 px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                      {getPhoto(landlord.email) && (
                        <AvatarImage src={getPhoto(landlord.email) || ''} referrerPolicy="no-referrer" />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 font-bold text-sm italic">
                        {(landlord.name || 'L').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white tracking-tight text-lg">{landlord.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px] truncate">{landlord.address || 'Endereço não informado'}</p>
                      {landlord.registeredBy && (
                        <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                          👤 Cadastrado por: {landlord.registeredBy}
                        </p>
                      )}
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
                  {(() => {
                    const allDocs = Array.from(new Set([
                      ...(landlord.documentUrl ? [landlord.documentUrl] : []),
                      ...(landlord.documentUrls || [])
                    ]));

                    if (allDocs.length === 0) {
                      return (
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Pendente</span>
                      );
                    }

                    return (
                      <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                        {allDocs.map((url, idx) => {
                          const decodedUrl = decodeURIComponent(url);
                          const fileNameWithToken = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
                          const fileNameParts = fileNameWithToken.split('?')[0].split('_');
                          const displayFileName = fileNameParts.length > 1 && !isNaN(Number(fileNameParts[0])) 
                            ? fileNameParts.slice(1).join('_') 
                            : fileNameParts.join('_');

                          return (
                            <a 
                              key={url}
                              href={getSafeDocumentUrl(url)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                viewDocumentSecurely(url, displayFileName || `documento_${idx + 1}`);
                              }}
                              className="inline-flex items-center justify-center gap-1 w-[105px] px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-white rounded-md border border-indigo-500/20 text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-105 min-w-0"
                              title={displayFileName || `Documento ${idx + 1}`}
                            >
                              <FileText className="h-2.5 w-2.5 shrink-0 text-indigo-400" />
                              <span className="truncate">{displayFileName || `Doc ${idx + 1}`}</span>
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="py-5 px-8 text-right">
                  {user?.role !== 'broker' ? (
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
                  ) : (
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Visualização</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  Clock,
  FileText,
  Download
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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Cell 
} from 'recharts';
import { Contract, Property, Tenant, Payment } from '../../types';
import { viewDocumentSecurely, getSafeDocumentUrl } from '../../lib/documentViewer';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount);
    const statusText = data?.status === 'paid' ? 'Liquidado' : data?.status === 'overdue' ? 'Em Atraso' : 'Aguardando';
    const statusColor = data?.status === 'paid' ? 'text-emerald-500' : data?.status === 'overdue' ? 'text-rose-500' : 'text-amber-500';
    
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/15 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider font-sans">{data.name}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono mt-1">{formattedAmount}</p>
        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${statusColor}`}>{statusText}</p>
      </div>
    );
  }
  return null;
};

interface ContractsViewProps {
  contracts: Contract[];
  properties: Property[];
  tenants: Tenant[];
  payments: Payment[];
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
}

export function ContractsView({ contracts, properties, tenants, payments, onEdit, onDelete }: ContractsViewProps) {
  const [expandedContractId, setExpandedContractId] = React.useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedContractId(expandedContractId === id ? null : id);
  };
  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Contratos de Locação</h2>
          <p className="text-slate-400 font-medium mt-1">Arquitetura jurídica das relações comerciais.</p>
        </div>
      </div>

      <div className="grid gap-10">
        <AnimatePresence mode="popLayout">
          {contracts.map((contract, index) => {
            const property = properties.find(p => p.id === contract.propertyId);
            const tenant = tenants.find(t => t.id === contract.tenantId);
            const contractPayments = payments.filter(p => p.contractId === contract.id);
            const chartData = contractPayments
              .slice()
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(payment => {
                const date = new Date(payment.dueDate);
                const month = date.toLocaleDateString('pt-BR', { month: 'short' });
                const year = date.toLocaleDateString('pt-BR', { year: '2-digit' });
                return {
                  name: `${month}/${year}`,
                  amount: payment.amount,
                  status: payment.status,
                };
              });
            
            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.23, 1, 0.32, 1],
                  delay: index * 0.05 
                }}
              >
                <Card 
                  className={`border-white/10 shadow-2xl backdrop-blur-md bg-white/5 overflow-hidden rounded-[40px] relative group p-2 border transition-all duration-300 ${expandedContractId === contract.id ? 'ring-2 ring-indigo-500/50' : ''}`}
                >
                  <div 
                    className="bg-white/5 rounded-[35px] border border-white/10 backdrop-blur-sm cursor-pointer"
                    onClick={() => toggleExpand(contract.id)}
                  >
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
                      <div className="grid md:grid-cols-4 gap-8 border-t border-white/5 pt-10 mt-4">
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
                        <div className="space-y-3">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20 shadow-inner">
                            <FileText className="h-5 w-5 text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Documentos do Contrato</span>
                          {contract.documentUrls && contract.documentUrls.length > 0 ? (
                            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                              {contract.documentUrls.map((url, idx) => {
                                const decodedUrl = decodeURIComponent(url);
                                const fileNameWithToken = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
                                const fileNameParts = fileNameWithToken.split('?')[0].split('_');
                                const displayFileName = fileNameParts.length > 1 && !isNaN(Number(fileNameParts[0])) 
                                  ? fileNameParts.slice(1).join('_') 
                                  : fileNameParts.join('_');
                                
                                return (
                                  <div 
                                    key={url} 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      viewDocumentSecurely(url, displayFileName);
                                    }}
                                    className="flex items-center gap-2 p-2 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer active:scale-[0.98] group/item"
                                    title={`Clique para visualizar ${displayFileName}`}
                                  >
                                    <FileText className="h-4 w-4 text-emerald-400 group-hover/item:text-emerald-300 transition-colors shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-300 group-hover/item:text-white truncate leading-tight flex-1">
                                      {displayFileName || `Documento ${idx + 1}`}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : contract.documentUrl ? (
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-emerald-400 truncate leading-tight">Contrato Digital Anexo</p>
                              <a 
                                href={getSafeDocumentUrl(contract.documentUrl)} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  viewDocumentSecurely(contract.documentUrl || '', 'contrato_digital');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest transition-all"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Visualizar Contrato
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-400">Nenhum Arquivo</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-normal">Sem anexos no contrato</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 px-10 bg-white/5 rounded-b-[35px] border-t border-white/5 flex flex-col gap-6">
                      <div className="w-full flex justify-between items-center">
                        <div className="flex gap-4">
                          <Button 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(contract.id);
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 px-6 py-4 rounded-xl transition-all"
                          >
                            Excluir
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white/10 px-6 py-4 rounded-xl transition-all font-mono"
                          >
                            VER PAGAMENTOS {expandedContractId === contract.id ? '↑' : '↓'}
                          </Button>
                        </div>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(contract);
                          }}
                          className="h-12 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest bg-indigo-600 border-none hover:bg-indigo-700 transform hover:-translate-y-1 transition-all shadow-xl shadow-indigo-500/25 text-white"
                        >
                          Ajustar Termos
                        </Button>
                      </div>

                      <AnimatePresence>
                        {expandedContractId === contract.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="pt-6 border-t border-white/10 mt-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
                                <span className="h-1 w-8 bg-indigo-500/30 rounded-full"></span>
                                Histórico Financeiro
                              </h4>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
                                {/* Chart Section */}
                                <div className="lg:col-span-3 flex flex-col justify-between">
                                  <div className="mb-4">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                                      Fluxo de Caixa Mensal
                                    </h5>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                                      Vencimentos e históricos do contrato
                                    </p>
                                  </div>
                                  
                                  {contractPayments.length > 0 ? (
                                    <div className="h-[220px] w-full p-2 bg-slate-500/5 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl flex items-center justify-center">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                          data={chartData}
                                          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                                        >
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                                          <XAxis 
                                            dataKey="name" 
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                                          />
                                          <YAxis 
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                                            tickFormatter={(val) => `R$ ${val}`}
                                          />
                                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                                          <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={38}>
                                            {contractPayments.map((entry, idx) => {
                                              const color = entry.status === 'paid' ? '#10b981' : 
                                                            entry.status === 'overdue' ? '#f43f5e' : 
                                                            '#f59e0b';
                                              return <Cell key={`cell-${idx}`} fill={color} />;
                                            })}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                  ) : (
                                    <div className="h-[220px] flex items-center justify-center rounded-2xl border border-dashed border-slate-200/50 dark:border-white/5 bg-slate-500/5 dark:bg-white/[0.02]">
                                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">
                                        Falta de dados de faturamento
                                      </p>
                                    </div>
                                  )}
                                  
                                  {contractPayments.length > 0 && (
                                    <div className="flex gap-4 items-center justify-end mt-4 text-[9px] font-bold uppercase tracking-widest">
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                                        <span className="text-slate-500">Liquidado</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                                        <span className="text-slate-500">Aguardando</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                                        <span className="text-slate-500">Em Atraso</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* List Section */}
                                <div className="lg:col-span-2 flex flex-col justify-between">
                                  <div className="mb-4">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                                      Detalhamento das Parcelas
                                    </h5>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                                      Controle de fluxo de recebíveis
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 flex-1">
                                    {contractPayments.length > 0 ? (
                                      contractPayments
                                        .slice()
                                        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                                        .map((payment) => (
                                          <div 
                                            key={payment.id} 
                                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/row"
                                          >
                                            <div className="flex items-center gap-4">
                                              <div className={`h-2 w-2 rounded-full ${
                                                payment.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                                payment.status === 'overdue' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                              }`} />
                                              <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Vencimento</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-white font-mono">{new Date(payment.dueDate).toLocaleDateString()}</p>
                                              </div>
                                            </div>
                                            
                                            <div className="text-right min-w-[100px]">
                                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Valor</p>
                                              <p className="text-sm font-bold text-slate-800 dark:text-white font-mono tracking-tighter">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                              </p>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <div className="py-10 text-center rounded-3xl bg-white/5 border border-dashed border-white/15">
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Nenhum vencimento registrado.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardFooter>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  Clock,
  FileText,
  Download,
  Scale,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  XCircle,
  Sparkles,
  Check,
  Briefcase,
  Maximize2
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
import { toast } from 'sonner';
import { Contract, Property, Tenant, Payment, Landlord } from '../../types';
import { viewDocumentSecurely, getSafeDocumentUrl } from '../../lib/documentViewer';
import { contractGeneratorService, ContractGenerationOptions } from '../../services/contractGeneratorService';
import { parseLocalDate } from '../../lib/dateUtils';

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
  landlords?: Landlord[];
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
  user?: any;
}

export function ContractsView({ contracts, properties, tenants, payments, landlords = [], onEdit, onDelete, user }: ContractsViewProps) {
  const [expandedContractId, setExpandedContractId] = React.useState<string | null>(null);
  const [selectedContractForDoc, setSelectedContractForDoc] = React.useState<Contract | null>(null);
  const [docOptions, setDocOptions] = React.useState<ContractGenerationOptions>({
    contractType: 'residential',
    warrantyType: 'deposit',
    warrantyValue: '',
    customClauses: '',
    readjustmentIndex: 'IPCA',
    commercialActivity: ''
  });

  const toggleExpand = (id: string) => {
    setExpandedContractId(expandedContractId === id ? null : id);
  };

  const handleOpenDocModal = (contract: Contract) => {
    const prop = properties.find(p => p.id === contract.propertyId);
    const isCommercialGuess = prop?.title.toLowerCase().includes('comercial') || 
                              prop?.description.toLowerCase().includes('sala') || 
                              prop?.description.toLowerCase().includes('loja') || 
                              prop?.description.toLowerCase().includes('galpão');
    
    setDocOptions({
      contractType: isCommercialGuess ? 'commercial' : 'residential',
      warrantyType: prop?.requiresDeposit ? 'deposit' : 'none',
      warrantyValue: prop?.requiresDeposit ? 'R$ ' + (contract.rentAmount * 3).toLocaleString('pt-BR') : '',
      customClauses: '',
      readjustmentIndex: 'IPCA',
      commercialActivity: isCommercialGuess ? 'Comércio e prestação de serviços' : ''
    });
    setSelectedContractForDoc(contract);
  };

  const handleDownloadPDF = () => {
    if (!selectedContractForDoc) return;
    const property = properties.find(p => p.id === selectedContractForDoc.propertyId);
    const tenant = tenants.find(t => t.id === selectedContractForDoc.tenantId);
    const landlord = landlords.find(l => l.id === property?.landlordId);
    
    if (!property || !tenant || !landlord) {
      toast.error('Dados insuficientes para compilar o contrato legal.');
      return;
    }
    
    try {
      const doc = contractGeneratorService.generatePDF(
        selectedContractForDoc,
        property,
        tenant,
        landlord,
        docOptions
      );
      doc.save(`Contrato_Locacao_${tenant.name.replace(/\s+/g, '_')}_${selectedContractForDoc.id.substring(0, 6)}.pdf`);
      toast.success('Contrato PDF gerado com carimbo profissional Aluga Fácil!');
    } catch (err) {
      console.error(err);
      toast.error('Houve um erro de compilação jurídica ao exportar o PDF.');
    }
  };
  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-slate-200 dark:border-white/10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-white serif italic">Contratos de Locação</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Arquitetura jurídica das relações comerciais.</p>
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
              .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime())
              .map(payment => {
                const date = parseLocalDate(payment.dueDate);
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
                  className={`border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-md bg-white/70 dark:bg-white/5 overflow-hidden rounded-[40px] relative group p-2 border transition-all duration-300 ${expandedContractId === contract.id ? 'ring-2 ring-indigo-500/50' : ''}`}
                >
                  <div 
                    className="bg-slate-50 dark:bg-white/5 rounded-[35px] border border-slate-150 dark:border-white/10 backdrop-blur-sm cursor-pointer"
                    onClick={() => toggleExpand(contract.id)}
                  >
                    <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                      <div>
                        <Badge className="bg-slate-100 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold uppercase tracking-widest text-[9px] mb-4 shadow-sm px-3">Status: Ativo</Badge>
                        {property && (
                          <div className="text-[15px] font-sans font-normal text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                            Locador: {landlords.find(l => l.id === property.landlordId)?.name || 'Não informado'}
                          </div>
                        )}
                        <CardTitle className="text-[15px] font-normal text-slate-800 dark:text-white serif italic tracking-tight">Acordo #{contract.id}</CardTitle>
                      </div>
                      <div className="text-right text-[15px] font-normal text-slate-500">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Taxa de Locação</p>
                        <p className="text-[25px] font-bold text-slate-800 dark:text-white font-mono tracking-tighter">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.rentAmount)}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-0">
                      <div className="grid md:grid-cols-4 gap-8 border-t border-slate-200 dark:border-white/5 pt-10 mt-4">
                        <div className="space-y-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20 shadow-inner">
                            <Building2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Objeto do Contrato</span>
                          <p className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight">{property?.title}</p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{property?.address}</p>
                        </div>
                        <div className="space-y-3">
                           <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5 border border-purple-500/20 shadow-inner">
                            <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Nome do Inquilino</span>
                          <p className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{tenant?.name}</p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Documento: {tenant?.cpf}</p>
                        </div>
                        <div className="space-y-3">
                           <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5 border border-orange-500/20 shadow-inner">
                            <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Período de Vigência</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono text-xs bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10">{new Date(contract.startDate).toLocaleDateString()}</Badge>
                            <span className="text-slate-500 font-bold tracking-tighter">···</span>
                            <Badge variant="outline" className="font-mono text-xs bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10">{new Date(contract.endDate).toLocaleDateString()}</Badge>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 font-semibold">Pagamento Mensal: DIA {contract.dayOfPayment}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20 shadow-inner">
                            <FileText className="h-5 w-5 text-emerald-550 dark:text-emerald-400" />
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
                                    className="flex items-center gap-2 p-2 bg-slate-100/50 dark:bg-white/5 hover:bg-emerald-500/10 border border-slate-200 dark:border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer active:scale-[0.98] group/item"
                                    title={`Clique para visualizar ${displayFileName}`}
                                  >
                                    <FileText className="h-4 w-4 text-emerald-500 dark:text-emerald-400 group-hover/item:text-emerald-400 transition-colors shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 group-hover/item:text-slate-900 dark:group-hover/item:text-white truncate leading-tight flex-1">
                                      {displayFileName || `Documento ${idx + 1}`}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : contract.documentUrl ? (
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 truncate leading-tight">Contrato Digital Anexo</p>
                              <a 
                                href={getSafeDocumentUrl(contract.documentUrl)} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  viewDocumentSecurely(contract.documentUrl || '', 'contrato_digital');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-white rounded-lg border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest transition-all"
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
                    <CardFooter className="p-8 px-10 bg-slate-100/50 dark:bg-white/5 rounded-b-[35px] border-t border-slate-200 dark:border-white/5 flex flex-col gap-6">
                      <div className="w-full flex justify-between items-center">
                        <div className="flex gap-4">
                          {user?.role !== 'landlord_pleno' && (
                            <Button 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(contract.id);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 px-6 py-4 rounded-xl transition-all"
                            >
                              Excluir
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(contract.id);
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-250/50 dark:hover:bg-white/10 px-6 py-4 rounded-xl transition-all font-mono"
                          >
                            VER PAGAMENTOS {expandedContractId === contract.id ? '↑' : '↓'}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {user?.role !== 'landlord_pleno' && (
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocModal(contract);
                              }}
                              className="h-12 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest bg-emerald-600 border-none hover:bg-emerald-700 transform hover:-translate-y-1 transition-all shadow-md shadow-emerald-500/10 text-white flex items-center gap-1.5"
                            >
                              <Scale className="h-4 w-4" />
                              Gerar Contrato Profissional
                            </Button>
                          )}
                          {user?.role !== 'landlord_pleno' && (
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(contract);
                              }}
                              variant="outline"
                              className="h-12 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest border-slate-200 dark:border-white/10 text-slate-750 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                            >
                              Ajustar Termos
                            </Button>
                          )}
                        </div>
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
                            <div className="pt-6 border-t border-slate-200 dark:border-white/10 mt-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2">
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
                                    <div className="h-[220px] w-full p-2 bg-slate-500/5 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center">
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
                                            width={75}
                                            tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                                            tickFormatter={(val) => `R$ ${val}`}
                                          />
                                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                                          <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={38}>
                                            {chartData.map((entry, idx) => {
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
                                    <div className="h-[220px] flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/5 bg-slate-500/5 dark:bg-white/[0.02]">
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
                                        .sort((a, b) => parseLocalDate(b.dueDate).getTime() - parseLocalDate(a.dueDate).getTime())
                                        .map((payment) => (
                                          <div 
                                            key={payment.id} 
                                            className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group/row"
                                          >
                                            <div className="flex items-center gap-4">
                                              <div className={`h-2 w-2 rounded-full ${
                                                payment.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                                payment.status === 'overdue' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                              }`} />
                                              <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Vencimento</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-white font-mono">{parseLocalDate(payment.dueDate).toLocaleDateString()}</p>
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
                                      <div className="py-10 text-center rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
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

      {/* Contract Builder & Preview Dialog */}
      <AnimatePresence>
        {selectedContractForDoc && (
          (() => {
            const contract = selectedContractForDoc;
            const property = properties.find(p => p.id === contract.propertyId);
            const tenant = tenants.find(t => t.id === contract.tenantId);
            const landlord = landlords.find(l => l.id === property?.landlordId);

            if (!property || !tenant || !landlord) return null;

            const previewText = contractGeneratorService.getTemplateText(
              contract,
              property,
              tenant,
              landlord,
              docOptions
            );

            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="relative w-full max-w-6xl overflow-hidden rounded-[30px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
                >
                  {/* Header */}
                  <div className="bg-slate-50 dark:bg-slate-950 px-8 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="serif text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          Gerador de Contrato Profissional de Locação
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold font-mono tracking-widest text-[9px]">LEI 8.245 / 91</Badge>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure as cláusulas do contrato de acordo com as necessidades comerciais/residenciais.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedContractForDoc(null)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-all"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Split body: left configurations, right scrollable live preview */}
                  <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 min-h-[450px]">
                    {/* Configurations side */}
                    <div className="lg:col-span-2 p-8 border-r border-slate-200 dark:border-white/5 space-y-6 overflow-y-auto max-h-[65vh]">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Ajustes Legais
                      </h4>

                      {/* Contract Type */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Finalidade do Contrato</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setDocOptions({ ...docOptions, contractType: 'residential' })}
                            className={`px-4 py-3 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                              docOptions.contractType === 'residential'
                                ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-500'
                                : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white border-slate-200 dark:border-white/5'
                            }`}
                          >
                            Residencial
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocOptions({ ...docOptions, contractType: 'commercial' })}
                            className={`px-4 py-3 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                              docOptions.contractType === 'commercial'
                                ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-500'
                                : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white border-slate-200 dark:border-white/5'
                            }`}
                          >
                            Comercial
                          </button>
                        </div>
                      </div>

                      {/* Commercial Activity specifically */}
                      {docOptions.contractType === 'commercial' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Ramo de Atividade</label>
                          <input
                            type="text"
                            value={docOptions.commercialActivity}
                            onChange={(e) => setDocOptions({ ...docOptions, commercialActivity: e.target.value })}
                            placeholder="Ex: Consultório Médico, Prestador de Serviços, Comércio de Roupas"
                            className="w-full h-11 bg-slate-50 dark:bg-white/5 border border-slate-250 dark:border-white/10 rounded-xl px-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      {/* Indexation readjustment */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Índice Tributário / Reajuste</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['IPCA', 'IGP-M', 'Sem Reajuste'].map((indexType) => (
                            <button
                              key={indexType}
                              type="button"
                              onClick={() => setDocOptions({ ...docOptions, readjustmentIndex: indexType as any })}
                              className={`px-2 py-2.5 rounded-lg border text-[11px] font-bold transition-all ${
                                docOptions.readjustmentIndex === indexType
                                  ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border-indigo-500'
                                  : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5'
                              }`}
                            >
                              {indexType}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Warranties */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Garantia Locatícia</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'deposit', label: 'Caução (Depósito)' },
                            { value: 'guarantor', label: 'Fiador e Bens' },
                            { value: 'none', label: 'Sem Garantia' }
                          ].map((warranty) => (
                            <button
                              key={warranty.value}
                              type="button"
                              onClick={() => setDocOptions({ ...docOptions, warrantyType: warranty.value as any })}
                              className={`px-2 py-2.5 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                                docOptions.warrantyType === warranty.value
                                  ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border-indigo-500'
                                  : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5'
                              }`}
                            >
                              <span>{warranty.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Detail inputs for warranty */}
                      {docOptions.warrantyType !== 'none' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                            {docOptions.warrantyType === 'deposit' ? 'Valor Adiantado (Caução)' : 'Qualificação Completa do Fiador'}
                          </label>
                          <input
                            type="text"
                            value={docOptions.warrantyValue || ''}
                            onChange={(e) => setDocOptions({ ...docOptions, warrantyValue: e.target.value })}
                            placeholder={docOptions.warrantyType === 'deposit' ? 'Ex: R$ 6.000,00' : 'Nome completo, CPF CPF, e descrição de imóveis dados em garantia.'}
                            className="w-full h-11 bg-slate-50 dark:bg-white/5 border border-slate-250 dark:border-white/10 rounded-xl px-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      {/* Special clauses */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Cláusulas de Acordo Especial</label>
                        <textarea
                          rows={3}
                          value={docOptions.customClauses}
                          onChange={(e) => setDocOptions({ ...docOptions, customClauses: e.target.value })}
                          placeholder="Adicione cláusulas customizadas aqui (ex: permissão de pets, descontos de reforma etc.) para incluí-las automaticamente no documento legal."
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-250 dark:border-white/10 rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    </div>

                    {/* Previews side (stunning readable layout) */}
                    <div className="lg:col-span-3 p-8 bg-slate-50 dark:bg-slate-950/40 overflow-y-auto max-h-[65vh] space-y-8 font-sans">
                      <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-emerald-500" />
                          PRÉ-VISUALIZAÇÃO EM TEMPO REAL
                        </span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-white/80 dark:bg-white/5 text-slate-500 font-mono text-[10px] uppercase font-bold">{docOptions.contractType === 'commercial' ? 'Comercial' : 'Residencial'}</Badge>
                          <Badge variant="outline" className="bg-white/80 dark:bg-white/5 text-slate-550 font-mono text-[10px] uppercase font-bold">{docOptions.readjustmentIndex}</Badge>
                        </div>
                      </div>

                      <div className="p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-lg relative select-none">
                        <div className="text-center font-bold text-slate-800 dark:text-white mb-6 tracking-tight text-xs md:text-sm max-w-md mx-auto">
                          {previewText.title}
                        </div>

                        <div className="space-y-6 text-[11px] md:text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans">
                          {previewText.sections.map((sec, idx) => (
                            <div key={idx} className="space-y-2">
                              <h5 className="font-bold text-slate-800 dark:text-white">{sec.title}</h5>
                              <p className="whitespace-pre-wrap">{sec.content}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Fake Signature blocks just for preview */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-8 text-center text-[10px] font-semibold text-slate-400">
                          <div className="space-y-1">
                            <div className="border-b border-slate-200 dark:border-white/10 pb-1 pt-4 font-normal">Assinatura do Locador</div>
                            <div className="font-bold text-slate-600 dark:text-white font-mono truncate">{landlord.name}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="border-b border-slate-200 dark:border-white/10 pb-1 pt-4 font-normal">Assinatura do Locatário</div>
                            <div className="font-bold text-slate-600 dark:text-white font-mono truncate">{tenant.name}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer control panel */}
                  <div className="bg-slate-50 dark:bg-slate-950 px-8 py-5 border-t border-slate-200 dark:border-white/10 flex justify-between items-center shrink-0">
                    <Button
                      variant="ghost" 
                      onClick={() => setSelectedContractForDoc(null)}
                      className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-150 dark:hover:bg-white/5 py-4 px-6 rounded-xl transition-all"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleDownloadPDF}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-md flex items-center gap-2 transform active:scale-95"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Contrato Oficial (.PDF)
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}

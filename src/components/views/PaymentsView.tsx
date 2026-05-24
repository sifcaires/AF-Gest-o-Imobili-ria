import React, { useState } from 'react';
import { 
  CreditCard, 
  FileDown, 
  FileText, 
  Trash2,
  Check,
  CheckCircle2,
  Share2,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  Send,
  Calendar,
  AlertCircle,
  QrCode,
  Copy
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Payment, Contract, Tenant, Property, Landlord } from '../../types';
import { boletoService, generatePixCode } from '../../services/boletoService';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface PaymentsViewProps {
  payments: Payment[];
  contracts: Contract[];
  tenants: Tenant[];
  properties: Property[];
  landlords?: Landlord[];
  onEdit: (p: Payment) => void;
  onDelete: (id: string) => void;
  onUpdatePayment?: (id: string, data: Partial<Payment>) => Promise<void>;
}

export function PaymentsView({ payments, contracts, tenants, properties, landlords = [], onEdit, onDelete, onUpdatePayment }: PaymentsViewProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeBoletoScreen, setActiveBoletoScreen] = useState<'menu' | 'whatsapp' | 'email'>('menu');
  const [screenQrCodeUrl, setScreenQrCodeUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const getBeneficiaryPixKey = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return '';
    
    // Look up landlord from beneficiaryId
    let beneficiary = landlords.find(l => l.id === contract.beneficiaryId || l.ownerId === contract.beneficiaryId);
    if (!beneficiary) {
      // Fallback to property landlord
      const property = properties.find(p => p.id === contract.propertyId);
      if (property) {
        beneficiary = landlords.find(l => l.id === property.landlordId);
      }
    }
    return beneficiary?.pixKey || '';
  };

  const getPaymentCalculationDetails = (payment: Payment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = new Date(payment.dueDate);
    limitDate.setHours(23, 59, 59, 999);
    const isOverdue = payment.status === 'overdue' || today > limitDate;
    
    let activeDiscount = 0;
    let isDiscountCurrentlyActive = false;
    
    if (payment.discountAmount && payment.discountAmount > 0) {
      isDiscountCurrentlyActive = true;
      
      // Check start date limit
      if (payment.discountStartDate) {
        const start = new Date(payment.discountStartDate);
        start.setHours(0, 0, 0, 0);
        if (today < start) {
          isDiscountCurrentlyActive = false;
        }
      }
      
      // Check end date limit
      if (payment.discountEndDate) {
        const end = new Date(payment.discountEndDate);
        end.setHours(23, 59, 59, 999);
        if (today > end) {
          isDiscountCurrentlyActive = false;
        }
      } else {
        // Fallback to dueDate
        if (today > limitDate) {
          isDiscountCurrentlyActive = false;
        }
      }
      
      if (isDiscountCurrentlyActive) {
        activeDiscount = payment.discountAmount;
      }
    }
    
    if (isOverdue) {
      const timeDiff = today.getTime() - limitDate.getTime();
      const daysPast = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      const penaltyPercent = payment.penaltyPercent !== undefined ? payment.penaltyPercent : 10;
      const penaltyAmount = payment.amount * (penaltyPercent / 100);
      const interestPercent = payment.interestPercent !== undefined ? payment.interestPercent : 1;
      const dailyInterestVal = (payment.amount * (interestPercent / 100)) / 30;
      const totalInterest = dailyInterestVal * daysPast;
      const finalVal = payment.amount + penaltyAmount + totalInterest;
      
      return {
        isOverdue: true,
        finalAmount: finalVal,
        discount: 0,
        penaltyAmount,
        totalInterest,
        daysPast,
        text: `Valor Nominal: ${payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
              `Multa (${penaltyPercent}%): ${penaltyAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
              `Juros de Mora (${daysPast} dias): ${totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      };
    } else {
      const finalVal = Math.max(0, payment.amount - activeDiscount);
      
      // Create detailed description about discount validity
      let discountText = 'Valor nominal sem descontos';
      if (payment.discountAmount && payment.discountAmount > 0) {
        if (isDiscountCurrentlyActive) {
          discountText = `Desconto de Pontualidade Ativo: ${activeDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
          if (payment.discountEndDate) {
            const formattedEnd = new Date(payment.discountEndDate).toLocaleDateString('pt-BR');
            discountText += ` (Válido até ${formattedEnd})`;
          }
        } else {
          if (payment.discountStartDate && today < new Date(payment.discountStartDate)) {
            const formattedStart = new Date(payment.discountStartDate).toLocaleDateString('pt-BR');
            discountText = `Desconto programado para iniciar em ${formattedStart}`;
          } else {
            discountText = 'Período de desconto expirado. Valor nominal devido.';
          }
        }
      }
      
      return {
        isOverdue: false,
        finalAmount: finalVal,
        discount: activeDiscount,
        penaltyAmount: 0,
        totalInterest: 0,
        daysPast: 0,
        text: discountText
      };
    }
  };

  React.useEffect(() => {
    if (selectedPayment) {
      const tenant = getTenant(selectedPayment.contractId);
      const pixKey = getBeneficiaryPixKey(selectedPayment.contractId);
      const { finalAmount } = getPaymentCalculationDetails(selectedPayment);
      const code = generatePixCode(finalAmount, selectedPayment.id, tenant?.name || 'Inquilino', pixKey);
      QRCode.toDataURL(code, { width: 256, margin: 1 })
        .then(url => setScreenQrCodeUrl(url))
        .catch(err => console.error('Error generating screen QR Code', err));
      setIsCopied(false);
    } else {
      setScreenQrCodeUrl('');
      setIsCopied(false);
    }
  }, [selectedPayment, landlords]);

  // Filtering and searching state
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payoff state ("Baixa de pagamento")
  const [payoffPayment, setPayoffPayment] = useState<Payment | null>(null);
  const [payoffDate, setPayoffDate] = useState<string>('');
  const [payoffAmount, setPayoffAmount] = useState<number>(0);
  const [payoffMethod, setPayoffMethod] = useState<string>('pix');
  const [isSubmittingPayoff, setIsSubmittingPayoff] = useState(false);

  // Email state variables
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // WhatsApp state variables
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappText, setWhatsappText] = useState('');

  const getTenantName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return 'N/A';
    const tenant = tenants.find(t => t.id === contract.tenantId);
    return tenant?.name || 'N/A';
  };

  const getTenant = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return null;
    return tenants.find(t => t.id === contract.tenantId) || null;
  };

  const getPropertyAddress = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return 'N/A';
    const property = properties.find(p => p.id === contract.propertyId);
    return property?.address || 'N/A';
  };

  // Financial Stats calculations
  const totalReceived = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOverdue = payments
    .filter(p => p.status === 'overdue')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalInvoiced = payments.reduce((acc, curr) => acc + curr.amount, 0);

  // Filter payments
  const filteredPayments = payments.filter(p => {
    // 1. Status Filter
    if (activeFilter === 'pending' && p.status !== 'pending') return false;
    if (activeFilter === 'overdue' && p.status !== 'overdue') return false;
    if (activeFilter === 'paid' && p.status !== 'paid') return false;

    // 2. Search box matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const tenantName = getTenantName(p.contractId).toLowerCase();
      const amountStr = p.amount.toString();
      const idStr = p.id.toLowerCase();
      const addr = getPropertyAddress(p.contractId).toLowerCase();
      
      return tenantName.includes(q) || amountStr.includes(q) || idStr.includes(q) || addr.includes(q);
    }

    return true;
  });

  const handleGenerateBoleto = async (payment: Payment) => {
    setIsGenerating(payment.id);
    try {
      const contract = contracts.find(c => c.id === payment.contractId);
      const tenant = tenants.find(t => t.id === contract?.tenantId);
      const property = properties.find(p => p.id === contract?.propertyId);

      if (!contract || !tenant || !property) {
        toast.error('Dados incompletos para gerar o boleto');
        return;
      }

      // Resolve the selected beneficiary or fallback to property owner
      let beneficiary = landlords?.find(l => l.id === contract.beneficiaryId || l.ownerId === contract.beneficiaryId);
      if (!beneficiary) {
        beneficiary = landlords?.find(l => l.id === property.landlordId);
      }

      await boletoService.generateForPayment(payment, tenant, property, beneficiary);
      toast.success('Boleto gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao gerar boleto');
    } finally {
      setIsGenerating(null);
    }
  };

  // Open "Dar Baixa" handler
  const handleOpenPayoff = (payment: Payment) => {
    setPayoffPayment(payment);
    setPayoffDate(new Date().toISOString().split('T')[0]);
    setPayoffAmount(payment.amount);
    setPayoffMethod('pix');
  };

  // Confirm Payoff logic (Baixa de pagamento)
  const handleConfirmPayoff = async () => {
    if (!payoffPayment) return;
    setIsSubmittingPayoff(true);
    try {
      if (onUpdatePayment) {
        await onUpdatePayment(payoffPayment.id, {
          status: 'paid',
          paymentDate: payoffDate,
          amount: payoffAmount,
        });
        toast.success(`Baixa registrada! Recebido ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payoffAmount)} de ${getTenantName(payoffPayment.contractId)}.`);
      } else {
        toast.error('Operação não configurada.');
      }
      setPayoffPayment(null);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao registrar a baixa de pagamento.');
    } finally {
      setIsSubmittingPayoff(false);
    }
  };

  // Initialize Email delivery screen variables
  const handleTriggerEmailScreen = (payment: Payment) => {
    const tenant = getTenant(payment.contractId);
    setEmailTo(tenant?.email || '');
    setEmailSubject(`AlugaFácil - Fatura de Aluguel via Pix Disponível #${payment.id.substring(0, 8)}`);
    
    const { finalAmount, isOverdue, discount, penaltyAmount, totalInterest, daysPast } = getPaymentCalculationDetails(payment);

    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount);
    const formattedDate = new Date(payment.dueDate).toLocaleDateString('pt-BR');
    const pixKey = getBeneficiaryPixKey(payment.contractId);
    const pixCode = generatePixCode(finalAmount, payment.id, tenant?.name || 'Inquilino', pixKey);

    const formattedDiscount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount);
    const formattedPenalty = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(penaltyAmount);
    const formattedInterest = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInterest);
    const formattedFinalAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount);
    
    let billingDetailsText = `- Valor Nominal: ${formattedAmount}\n`;
    if (isOverdue) {
      billingDetailsText += `- Multa por Atraso: ${formattedPenalty}\n` +
                          `- Juros por Atraso (${daysPast} dias): ${formattedInterest}\n` +
                          `- VALOR TOTAL ATUALIZADO: ${formattedFinalAmount}\n`;
    } else if (discount > 0) {
      billingDetailsText += `- Desconto de Pontualidade: ${formattedDiscount}\n` +
                          `- VALOR LÍQUIDO A PAGAR (até o vencimento): ${formattedFinalAmount}\n`;
    } else {
      billingDetailsText += `- VALOR TOTAL A PAGAR: ${formattedFinalAmount}\n`;
    }
    
    setEmailBody(
      `Prezado(a) ${tenant?.name || 'Inquilino'},\n\n` +
      `Esperamos que este e-mail o encontre bem.\n\n` +
      `Comunicamos que a fatura referente ao aluguel mensal já está gerada e disponível via pagamento Pix. Seguem os detalhes de faturamento:\n\n` +
      `- Cód Lançamento: #${payment.id}\n` +
      `${billingDetailsText}` +
      `- Data de Vencimento: ${formattedDate}\n` +
      `- Código Pix Copia e Cola:\n` +
      `  ${pixCode}\n\n` +
      `A fatura correspondente foi anexada a esta mensagem em formato PDF contendo o QR Code de digitalização.\n\n` +
      `Caso tenha dúvidas adicionais, ficamos à sua inteira disposição.\n\n` +
      `Atenciosamente,\n` +
      `Expediente Financeiro AlugaFácil`
    );
    setActiveBoletoScreen('email');
  };

  const handleSendEmailSimulation = () => {
    if (!emailTo) {
      toast.error('Favor inserir um e-mail válido.');
      return;
    }
    setIsSendingEmail(true);

    setTimeout(() => {
      setIsSendingEmail(false);
      toast.success(`E-mail de cobrança despachado com sucesso para ${emailTo}!`);
      setActiveBoletoScreen('menu');
    }, 1200);
  };

  const handleOpenNativeMail = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Initialize WhatsApp delivery screen variables
  const handleTriggerWhatsappScreen = (payment: Payment) => {
    const tenant = getTenant(payment.contractId);
    setWhatsappPhone(tenant?.phone || '');
    
    const { finalAmount, isOverdue, discount, penaltyAmount, totalInterest, daysPast } = getPaymentCalculationDetails(payment);

    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount);
    const formattedDate = new Date(payment.dueDate).toLocaleDateString('pt-BR');
    const pixKey = getBeneficiaryPixKey(payment.contractId);
    const pixCode = generatePixCode(finalAmount, payment.id, tenant?.name || 'Inquilino', pixKey);

    const formattedDiscount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount);
    const formattedPenalty = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(penaltyAmount);
    const formattedInterest = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInterest);
    const formattedFinalAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount);
    
    let billingDetailsText = `*Valor Nominal:* ${formattedAmount}\n`;
    if (isOverdue) {
      billingDetailsText += `*Multa por Atraso:* ${formattedPenalty}\n` +
                            `*Juros por Atraso (${daysPast} d):* ${formattedInterest}\n` +
                            `*VALOR TOTAL ATUALIZADO:* ${formattedFinalAmount}\n`;
    } else if (discount > 0) {
      billingDetailsText += `*Desconto Pontualidade:* ${formattedDiscount}\n` +
                            `*VALOR LÍQUIDO A PAGAR:* ${formattedFinalAmount}\n`;
    } else {
      billingDetailsText += `*VALOR A PAGAR:* ${formattedFinalAmount}\n`;
    }
    
    setWhatsappText(
      `Olá, *${tenant?.name || 'Inquilino'}*! 👋\n\n` +
      `Seguem os dados da fatura para pagamento do aluguel via Pix:\n` +
      `*ID Cobrança:* #${payment.id.substring(0, 8)}\n` +
      `${billingDetailsText}` +
      `*Vencimento:* ${formattedDate}\n\n` +
      `*Código Pix Copia e Cola para pagar pelo aplicativo do banco:*\n` +
      `${pixCode}\n\n` +
      `Agradecemos a sua cooperação.\n` +
      `*Equipe AlugaFácil Imobiliária*`
    );
    setActiveBoletoScreen('whatsapp');
  };

  const handleSendWhatsappLink = () => {
    if (!whatsappPhone) {
      toast.error('Insira o número de WhatsApp.');
      return;
    }
    const cleanPhone = whatsappPhone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank');
    toast.success('Abriu canal de mensagem WhatsApp!');
    setActiveBoletoScreen('menu');
  };

  return (
    <div className="space-y-10">
       <div className="border-b pb-8 border-white/10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white serif italic">Módulo Financeiro</h2>
          <p className="text-slate-400 font-medium mt-1">Conciliação de faturas, emissão de boletos de cobrança e controle de recebíveis.</p>
        </div>
        
        {/* Filtros Funcionais por Status */}
        <div className="flex flex-wrap gap-2 md:gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
           <Button 
             variant="ghost" 
             onClick={() => setActiveFilter('all')}
             className={`h-10 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
           >
             Todos
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setActiveFilter('pending')}
             className={`h-10 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeFilter === 'pending' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
           >
             Pendentes
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setActiveFilter('overdue')}
             className={`h-10 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeFilter === 'overdue' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:bg-white/5'}`}
           >
             Atrasados
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setActiveFilter('paid')}
             className={`h-10 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-white/5'}`}
           >
             Liquidados
           </Button>
        </div>
      </div>

      {/* Cards de Métricas Financeiras - Controle Financeiro em Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 shadow-xl backdrop-blur-md bg-white/5 p-6 rounded-3xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Total Liquidado</span>
            <p className="text-2xl font-bold text-emerald-400 font-mono tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceived)}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border-white/10 shadow-xl backdrop-blur-md bg-white/5 p-6 rounded-3xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Contas a Receber</span>
            <p className="text-2xl font-bold text-indigo-400 font-mono tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <Clock className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border-white/10 shadow-xl backdrop-blur-md bg-white/5 p-6 rounded-3xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Inadimplência (Atrasados)</span>
            <p className="text-2xl font-bold text-rose-400 font-mono tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOverdue)}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border-white/10 shadow-xl backdrop-blur-md bg-white/5 p-6 rounded-3xl border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Faturamento Geral</span>
            <p className="text-2xl font-bold text-slate-300 font-mono tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvoiced)}
            </p>
          </div>
          <div className="p-3 bg-slate-500/10 rounded-2xl text-slate-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Caixa de Pesquisa Interna */}
      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
         <Input 
           placeholder="Procurar lançamentos por inquilino, valor ou código..." 
           className="pl-12 h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 rounded-2xl focus-visible:ring-indigo-500/50" 
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      <Card className="border-white/10 shadow-2xl backdrop-blur-md bg-white/5 overflow-hidden rounded-3xl border">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 px-10 text-slate-400">Lançamento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Vencimento</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Valor Bruto</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest py-8 text-slate-400">Status</TableHead>
              <TableHead className="text-right py-8 px-10 text-slate-400">Operações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center text-slate-500 font-medium">
                  Não foram localizados registros financeiros para o critério selecionado.
                </TableCell>
              </TableRow>
            ) : filteredPayments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-white/5 transition-all border-b border-white/5 group">
                <TableCell className="py-8 px-10 text-white">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm tracking-tight">{getTenantName(payment.contractId)}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {payment.title || 'Cobrança Mensal'} #{payment.id.substring(0, 8)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-slate-400 italic">
                  {new Date(payment.dueDate).toLocaleDateString()}
                  {payment.paymentDate && (
                    <span className="block text-[9px] font-semibold text-emerald-400 mt-1 uppercase">Pago em: {new Date(payment.paymentDate).toLocaleDateString()}</span>
                  )}
                </TableCell>
                <TableCell className="text-lg font-bold text-white font-mono tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                </TableCell>
                <TableCell>
                  <Badge className={
                    payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10 font-bold px-4 py-1.5' : 
                    payment.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-500/10 font-bold px-4 py-1.5' : 
                    'bg-slate-900/50 text-white border-white/10 shadow-lg shadow-slate-900/50 font-bold px-4 py-1.5 border'
                  }>
                    {payment.status === 'paid' ? 'LIQUIDADO' : payment.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-10">
                  <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    
                    {/* Botão de Registro de Baixa Rápida */}
                    {payment.status !== 'paid' && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleOpenPayoff(payment)}
                        className="h-10 px-3.5 rounded-xl border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-950/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Baixa
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      onClick={() => onEdit(payment)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                      title="Editar"
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={() => handleGenerateBoleto(payment)}
                      disabled={isGenerating === payment.id}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-indigo-500/10 text-indigo-400 border hover:border-indigo-500/30 transition-all"
                      title="Baixar PDF da Fatura"
                    >
                      {isGenerating === payment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog 
                      open={!!selectedPayment && selectedPayment.id === payment.id} 
                      onOpenChange={(open) => {
                        if (!open) {
                          setSelectedPayment(null);
                          setActiveBoletoScreen('menu');
                        }
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button 
                            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-indigo-500/25 transition-all"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setActiveBoletoScreen('menu');
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                            Cobrança Pix
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-[1100px] overflow-hidden p-0 border-white/10 shadow-2xl rounded-3xl frosted max-h-[92vh] overflow-y-auto">
                        
                        {/* HEADER DA COBRANÇA */}
                        <div className="bg-indigo-600 text-white py-5 px-6 flex flex-col items-center gap-2 relative overflow-hidden shrink-0">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 -translate-y-12"></div>
                          
                          <div className="text-center relative z-10">
                            {activeBoletoScreen === 'menu' && (
                              <>
                                <h3 className="text-xl font-bold serif italic">Opções de Cobrança</h3>
                                <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5">Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}</p>
                              </>
                            )}
                            {activeBoletoScreen === 'whatsapp' && (
                              <>
                                <h3 className="text-xl font-bold serif italic flex items-center justify-center gap-2">
                                  <MessageSquare className="h-4 w-4" /> Enviar por WhatsApp
                                </h3>
                                <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5">Inquilino: {getTenantName(payment.contractId)}</p>
                              </>
                            )}
                            {activeBoletoScreen === 'email' && (
                              <>
                                <h3 className="text-xl font-bold serif italic flex items-center justify-center gap-2">
                                  <Mail className="h-4 w-4" /> Enviar por E-mail
                                </h3>
                                <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5">Inquilino: {getTenantName(payment.contractId)}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* CORPO DINÂMICO CONFORME A TELA */}
                        <div className="p-6 space-y-4 bg-[#0f171c]">
                          
                          {/* COBRANÇA MENU PRINCIPAL */}
                          {activeBoletoScreen === 'menu' && (
                            <>
                              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                                <div>
                                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Inquilino (Sacado)</span>
                                   <p className="text-sm font-bold text-white serif italic truncate">{getTenantName(payment.contractId)}</p>
                                </div>
                                <div className="text-right">
                                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Total Deste Pix</span>
                                   <p className="text-base font-bold text-indigo-400 font-mono tracking-tighter">
                                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                       getPaymentCalculationDetails(payment).finalAmount
                                     )}
                                   </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {/* Visual Interactive QR Code Widget */}
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-3">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 font-bold">Pagamento Imediato via Pix</span>
                                  
                                  {screenQrCodeUrl ? (
                                    <div className="bg-white p-2 rounded-xl shadow-inner border border-indigo-500/20 max-w-[140px] aspect-square">
                                      <img src={screenQrCodeUrl} alt="Visual Pix QR Code" className="w-[120px] h-[120px] object-contain" />
                                    </div>
                                  ) : (
                                    <div className="h-[140px] w-[140px] rounded-xl bg-white/5 flex items-center justify-center animate-pulse border border-white/10 text-slate-500 text-xs">
                                      Carregando QR Code...
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-slate-400 text-center font-mono space-y-0.5 mt-1 border-b border-t border-white/5 py-2 w-full max-w-xs">
                                    {getPaymentCalculationDetails(payment).isOverdue ? (
                                      <span className="text-rose-400 font-bold block">Atrasado (Inclui multa e juros)</span>
                                    ) : getPaymentCalculationDetails(payment).discount > 0 ? (
                                      <span className="text-emerald-400 font-bold block">Com desconto pontual aplicado</span>
                                    ) : (
                                      <span className="text-slate-450 block">Valor nominal</span>
                                    )}
                                    <span className="text-[10px] text-slate-500 block whitespace-pre-line leading-relaxed mt-1">
                                      {getPaymentCalculationDetails(payment).text}
                                    </span>
                                  </div>

                                  <div className="w-full space-y-1.5">
                                    <p className="text-[9px] text-slate-450 font-medium">Escaneie o QR Code ou use a chave copia e cola abaixo:</p>
                                    
                                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl overflow-hidden">
                                      <span className="text-[8.5px] font-mono text-slate-400 truncate flex-grow text-left select-all">
                                        {generatePixCode(
                                          getPaymentCalculationDetails(payment).finalAmount,
                                          payment.id,
                                          getTenant(payment.contractId)?.name || 'Inquilino',
                                          getBeneficiaryPixKey(payment.contractId)
                                        )}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        type="button"
                                        className="h-7 w-7 text-indigo-404 hover:text-white hover:bg-indigo-600/20 rounded-lg shrink-0"
                                        title="Copiar Pix"
                                        onClick={() => {
                                          const pixKey = getBeneficiaryPixKey(payment.contractId);
                                          const { finalAmount } = getPaymentCalculationDetails(payment);
                                          const code = generatePixCode(finalAmount, payment.id, getTenant(payment.contractId)?.name || 'Inquilino', pixKey);
                                          navigator.clipboard.writeText(code);
                                          setIsCopied(true);
                                          toast.success('Código Pix Copia e Cola copiado com sucesso!');
                                        }}
                                      >
                                        {isCopied ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                                        ) : (
                                          <Copy className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <Button 
                                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 uppercase tracking-widest text-[9px] flex items-center justify-center gap-2"
                                  onClick={() => handleGenerateBoleto(payment)}
                                  disabled={isGenerating === payment.id}
                                >
                                  {isGenerating === payment.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <FileText className="h-3.5 w-3.5" />
                                  )}
                                  Baixar Fatura Pix (PDF)
                                </Button>

                                <div className="relative flex items-center py-1">
                                  <div className="flex-grow border-t border-white/5"></div>
                                  <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">Enviar Fatura</span>
                                  <div className="flex-grow border-t border-white/5"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <Button 
                                    variant="outline"
                                    className="h-11 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all shadow-md"
                                    onClick={() => handleTriggerWhatsappScreen(payment)}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    WhatsApp
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="h-11 border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold rounded-xl uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all shadow-md"
                                    onClick={() => handleTriggerEmailScreen(payment)}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                    Enviar E-mail
                                  </Button>
                                </div>
                                
                                <Button 
                                  variant="ghost" 
                                  className="w-full text-slate-400 font-bold text-[9px] uppercase tracking-widest h-10 hover:bg-white/5 hover:text-white rounded-xl" 
                                  onClick={() => setSelectedPayment(null)}
                                >
                                  Voltar ao Financeiro
                                </Button>
                              </div>
                            </>
                          )}

                          {/* ENVIO WHATSAPP */}
                          {activeBoletoScreen === 'whatsapp' && (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Número do WhatsApp (Código Pais + DDD)</Label>
                                <Input 
                                  id="phone"
                                  value={whatsappPhone}
                                  onChange={(e) => setWhatsappPhone(e.target.value)}
                                  className="border-white/10 bg-white/5 text-white h-11 rounded-lg focus-visible:ring-indigo-500/50 text-xs font-mono"
                                  placeholder="Ex: 5511999998888"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="msg" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Texto Formatar Cobrança</Label>
                                <textarea 
                                  id="msg"
                                  rows={6}
                                  value={whatsappText}
                                  onChange={(e) => setWhatsappText(e.target.value)}
                                  className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans resize-none h-44"
                                />
                              </div>

                              <div className="pt-4 border-t border-white/5 space-y-3">
                                <Button 
                                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                  onClick={handleSendWhatsappLink}
                                >
                                  <Send className="h-4 w-4" />
                                  Confirmar e Disparar WhatsApp
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="w-full h-11 text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                                  onClick={() => setActiveBoletoScreen('menu')}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* ENVIO E-MAIL */}
                          {activeBoletoScreen === 'email' && (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <Label htmlFor="emailTo" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-medium">E-mail Destinatário</Label>
                                <Input 
                                  id="emailTo"
                                  value={emailTo}
                                  onChange={(e) => setEmailTo(e.target.value)}
                                  className="border-white/10 bg-white/5 text-white h-11 rounded-lg focus-visible:ring-indigo-500/50 text-xs text-white"
                                  placeholder="inquilino@email.com"
                                  type="email"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="emailSub" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-medium">Assunto da Mensagem</Label>
                                <Input 
                                  id="emailSub"
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  className="border-white/10 bg-white/5 text-white h-11 rounded-lg focus-visible:ring-indigo-500/50 text-xs"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="emailBody" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-medium">Corpo do E-mail</Label>
                                <textarea 
                                  id="emailBody"
                                  rows={5}
                                  value={emailBody}
                                  onChange={(e) => setEmailBody(e.target.value)}
                                  className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-32"
                                />
                              </div>

                              <div className="flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                                 <FileText className="h-5 w-5 text-indigo-400" />
                                 <div className="text-left">
                                   <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Anexo Identificado</p>
                                   <p className="text-xs text-indigo-100 italic">Boleto_Faturamento.pdf (Gerado dinamicamente)</p>
                                 </div>
                              </div>

                              <div className="pt-4 border-t border-white/5 space-y-3">
                                <Button 
                                  className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                  onClick={handleSendEmailSimulation}
                                  disabled={isSendingEmail}
                                >
                                  {isSendingEmail ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                  Simular Envio do Servidor
                                </Button>
                                
                                <Button 
                                  variant="ghost"
                                  className="w-full h-11 border border-white/10 bg-transparent hover:bg-white/5 text-slate-300 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                  onClick={handleOpenNativeMail}
                                >
                                  <Mail className="h-4 w-4" />
                                  Usar E-mail Local (mailto:)
                                </Button>

                                <Button 
                                  variant="ghost" 
                                  className="w-full h-11 text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                                  onClick={() => setActiveBoletoScreen('menu')}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                                </Button>
                              </div>
                            </div>
                          )}

                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      onClick={() => onDelete(payment.id)}
                      className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/10 text-rose-400 border hover:border-rose-500/50 transition-colors"
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

      {/* DIALOG DE CONFIRMAÇÃO DE BAIXA - CONTROLE FINANCEIRO EM GERAL */}
      <Dialog open={!!payoffPayment} onOpenChange={(open) => !open && setPayoffPayment(null)}>
        <DialogContent className="sm:max-w-md frosted border-white/10 text-white rounded-3xl p-8 bg-slate-950/95 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
             <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
               <CheckCircle2 className="h-6 w-6" />
             </div>
             <DialogTitle className="serif italic text-2xl text-center text-white">Baixa de Recebível</DialogTitle>
             <DialogDescription className="text-center text-slate-400 text-xs">
               Confirme as informações abaixo antes de liquidar a cobrança do locatário.
             </DialogDescription>
          </DialogHeader>

          {payoffPayment && (
            <div className="space-y-4 py-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-2 gap-4">
                 <div className="col-span-2 border-b border-white/5 pb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inquilino (Devedor)</span>
                   <p className="text-sm font-bold text-white leading-tight mt-0.5">{getTenantName(payoffPayment.contractId)}</p>
                 </div>
                 <div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Imóvel Cobrado</span>
                   <p className="text-xs text-slate-300 font-medium truncate mt-0.5">{getPropertyAddress(payoffPayment.contractId)}</p>
                 </div>
                 <div className="text-right">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Total Devido</span>
                   <p className="text-sm font-bold text-white mt-0.5">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payoffPayment.amount)}
                   </p>
                 </div>
              </div>

              {/* INPUTS DE BAIXA */}
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="payoffAmt" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor Recebido (R$)</Label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
                       <Input 
                         type="number"
                         id="payoffAmt"
                         step="0.01"
                         value={payoffAmount}
                         onChange={(e) => setPayoffAmount(parseFloat(e.target.value) || 0)}
                         className="border-white/10 bg-white/5 text-white h-11 pl-9 rounded-xl focus-visible:ring-indigo-500/50 text-xs font-mono"
                       />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="payoffDt" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data de Recebimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                        type="date"
                        id="payoffDt"
                        value={payoffDate}
                        onChange={(e) => setPayoffDate(e.target.value)}
                        className="border-white/10 bg-white/5 text-white h-11 pl-9 rounded-xl focus-visible:ring-indigo-500/50 text-xs font-mono [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payoffMthd" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Canal de Liquidação / Pagamento</Label>
                  <Select value={payoffMethod} onValueChange={setPayoffMethod}>
                     <SelectTrigger id="payoffMthd" className="border-white/10 bg-white/5 text-white h-11 rounded-xl">
                       <SelectValue placeholder="Selecione o canal" />
                     </SelectTrigger>
                     <SelectContent className="frosted border-white/10 text-white bg-slate-900">
                       <SelectItem value="pix">PIX instantâneo</SelectItem>
                       <SelectItem value="boleto">Boleto Compensado</SelectItem>
                       <SelectItem value="money">Espécie / Dinheiro físico</SelectItem>
                       <SelectItem value="transfer">TED / DOC / Transferência</SelectItem>
                       <SelectItem value="credit">Cartão de Crédito</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 mt-4 border-t border-white/5">
                <Button 
                  variant="ghost" 
                  onClick={() => setPayoffPayment(null)}
                  className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/5 h-12 hover:text-white rounded-xl"
                  disabled={isSubmittingPayoff}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmPayoff}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg border-0 transition-all flex items-center justify-center gap-1.5"
                  disabled={isSubmittingPayoff}
                >
                  {isSubmittingPayoff ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar Baixa
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  FileText, 
  Printer, 
  Camera, 
  CheckCircle2, 
  Image as ImageIcon, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { Property, Contract, Tenant, Landlord, Inspection, InspectionArea } from '../../types';

// Pre-packaged placeholder inspection images representing various house conditions
const SAMPLE_PHOTOS = {
  excellent: [
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', // Clean Kitchen
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80', // Beautiful Living Room
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80', // Clean Bedroom
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80'  // Pristine Bathroom
  ],
  regular: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', // Standard tiles
    'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=600&q=80'  // Slightly worn room
  ],
  bad: [
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80', // Faint pipe leak
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'  // Cracks / dirty wall
  ]
};

interface InspectionsViewProps {
  properties: Property[];
  contracts: Contract[];
  tenants: Tenant[];
  landlords: Landlord[];
  inspections: Inspection[];
  addInspection: (data: Omit<Inspection, 'id' | 'ownerId'>) => Promise<void>;
  updateInspection: (id: string, data: Partial<Inspection>) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  user?: any;
}

const DEFAULT_AREAS = [
  { name: 'Sala de Estar (Piso, Paredes, Tomadas)', status: 'good' as const, comments: 'Pintura nova sem manchas. Rodapés íntegros. Tomadas funcionando.', photos: [] },
  { name: 'Cozinha e Área de Serviço', status: 'good' as const, comments: 'Pia de inox livre de infiltrações. Torneira com excelente fluxo. Azulejos inteiros.', photos: [] },
  { name: 'Quarto Principal', status: 'good' as const, comments: 'Janela correndo macio. Fechadura funcionando. Piso vinílico conservado.', photos: [] },
  { name: 'Banheiro Social', status: 'good' as const, comments: 'Vaso sanitário com descarga forte. Box de vidro limpo e correndo nos trilhos.', photos: [] },
  { name: 'Instalação Elétrica e Iluminação', status: 'good' as const, comments: 'Quadro de disjuntores atualizado. Lâmpadas acendendo adequadamente.', photos: [] },
  { name: 'Pintura Geral e Portas', status: 'good' as const, comments: 'Pintura inteiriça fosca em cor clara semi-nova. Portas sem empenar.', photos: [] }
];

export function InspectionsView({
  properties,
  contracts,
  tenants,
  landlords,
  inspections,
  addInspection,
  updateInspection,
  deleteInspection,
  user
}: InspectionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);

  // Form State
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [inspectionType, setInspectionType] = useState<'entrada' | 'saida'>('entrada');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectorName, setInspectorName] = useState(user?.displayName || 'Vistor Técnico Autorizado');
  const [inspectorEmail, setInspectorEmail] = useState(user?.email || '');
  const [generalObservations, setGeneralObservations] = useState('');
  
  // Custom Areas state
  const [areas, setAreas] = useState<InspectionArea[]>([...DEFAULT_AREAS]);
  const [newAreaName, setNewAreaName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Match inspections with properties for search
  const filteredInspections = inspections.filter(i => {
    const property = properties.find(p => p.id === i.propertyId);
    if (!property) return false;
    const searchLower = searchTerm.toLowerCase();
    return property.title.toLowerCase().includes(searchLower) || 
           property.address.toLowerCase().includes(searchLower) ||
           i.inspectorName.toLowerCase().includes(searchLower);
  });

  const handleAddField = () => {
    if (!newAreaName.trim()) {
      toast.error('Digite o nome do cômodo ou elemento a inspecionar.');
      return;
    }
    setAreas(prev => [...prev, {
      name: newAreaName.trim(),
      status: 'good',
      comments: '',
      photos: []
    }]);
    setNewAreaName('');
    toast.success(`Área "${newAreaName}" adicionada!`);
  };

  const handleRemoveField = (index: number) => {
    setAreas(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAreaChange = (index: number, field: keyof InspectionArea, value: any) => {
    setAreas(prev => {
      const clone = [...prev];
      clone[index] = {
        ...clone[index],
        [field]: value
      };
      return clone;
    });
  };

  const compressImageBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 600;
          const maxScale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * maxScale;
          canvas.height = img.height * maxScale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          } else {
            resolve(e.target?.result as string);
          }
        };
      };
    });
  };

  const handlePhotoUpload = async (areaIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedBase64s: string[] = [];
    toast.loading('Compactando e anexando fotos...', { id: 'pic-upload' });

    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await compressImageBase64(files[i]);
        uploadedBase64s.push(base64);
      } catch (err) {
        console.error(err);
      }
    }

    setAreas(prev => {
      const clone = [...prev];
      clone[areaIndex].photos = [...clone[areaIndex].photos, ...uploadedBase64s];
      return clone;
    });

    toast.success(`${uploadedBase64s.length} foto(s) anexadas ao laudo!`, { id: 'pic-upload' });
  };

  // Inject beautiful sample asset photos to make testing a breeze
  const handleSimulatePhoto = (areaIndex: number, condition: 'excellent' | 'regular' | 'bad') => {
    const list = SAMPLE_PHOTOS[condition];
    const randomIndex = Math.floor(Math.random() * list.length);
    const photoUrl = list[randomIndex];

    setAreas(prev => {
      const clone = [...prev];
      clone[areaIndex].photos = [...clone[areaIndex].photos, photoUrl];
      return clone;
    });
    toast.success('Imagem simulada anexada com sucesso!');
  };

  const handleClearPhotos = (areaIndex: number) => {
    setAreas(prev => {
      const clone = [...prev];
      clone[areaIndex].photos = [];
      return clone;
    });
    toast.success('Galeria limpa para esta área!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast.error('Por favor, selecione um imóvel para registrar a vistoria.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInspection({
        propertyId: selectedPropertyId,
        contractId: selectedContractId || undefined,
        type: inspectionType,
        date: inspectionDate,
        inspectorName,
        inspectorEmail: inspectorEmail || undefined,
        generalObservations,
        areas
      });

      // Clear Form
      setSelectedPropertyId('');
      setSelectedContractId('');
      setInspectionType('entrada');
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setGeneralObservations('');
      setAreas([...DEFAULT_AREAS]);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern jsPDF design for legal property inspector summaries
  const handleGeneratePDF = (inspection: Inspection) => {
    const targetProperty = properties.find(p => p.id === inspection.propertyId);
    if (!targetProperty) {
      toast.error('Imóvel associado não encontrado para geração de PDF.');
      return;
    }

    const doc = new jsPDF() as any;
    const pageWith = doc.internal.pageSize.getWidth();

    // Primary Brand Blue Header Palette
    doc.setFillColor(34, 43, 69); // Indigo Navy / Charcoal Slate
    doc.rect(0, 0, pageWith, 45, 'F');

    // Title Block
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('LAUDO DE VISTORIA IMOBILIÁRIA', 15, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`ALUGAFÁCIL - Vistorias Fotográficas e Registro de Conservação`, 15, 32);
    doc.text(`Visualização Técnica Oficiada`, pageWith - 80, 22);
    doc.text(`Data: ${inspection.date.split('-').reverse().join('/')}`, pageWith - 80, 32);

    // Meta Block info background
    doc.setFillColor(242, 244, 247);
    doc.rect(15, 53, pageWith - 30, 48, 'F');

    // Imóvel / Endereço
    doc.setTextColor(34, 43, 69);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. DADOS DE IDENTIFICAÇÃO DO IMÓVEL', 18, 60);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text('Imóvel:', 18, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(targetProperty.title, 45, 68);

    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', 18, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(targetProperty.address || 'Não especificado', 45, 75);

    doc.setFont('helvetica', 'bold');
    doc.text('Vistoriador:', 18, 82);
    doc.setFont('helvetica', 'normal');
    doc.text(`${inspection.inspectorName} (${inspection.inspectorEmail || 'vistorias@alugafacil.com'})`, 45, 82);

    doc.setFont('helvetica', 'bold');
    doc.text('Tipo do Laudo:', 18, 89);
    doc.setFont('helvetica', 'bold');
    if (inspection.type === 'entrada') {
      doc.setTextColor(16, 124, 65);
    } else {
      doc.setTextColor(217, 34, 76);
    }
    doc.text(inspection.type === 'entrada' ? 'ENTRADA (Chaves Prontas)' : 'SAÍDA (Encerramento)', 45, 89);

    // Grid details for checked areas using autotable
    const headers = [['Área/Item inspecionada', 'Estado', 'Parecer Técnico / Observações gerais']];
    const data = inspection.areas.map(a => {
      const statusMap = {
        excellent: 'Excelente (Novo)',
        good: 'Conservado (Bom)',
        regular: 'Desgastado (Regular)',
        bad: 'Deteriorado (Ruim)'
      };
      return [a.name, statusMap[a.status] || a.status, a.comments || '(Sem observações adicionais gravadas)'];
    });

    doc.setTextColor(34, 43, 69);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. PARECER GRÁFICO DE CONSERVAÇÃO', 15, 112);

    doc.autoTable({
      startY: 116,
      head: headers,
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [43, 54, 85], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 'auto' }
      }
    });

    let lastY = doc.autoTable.previous.finalY || 180;

    // Check if general observations fit
    if (inspection.generalObservations) {
      if (lastY > 240) {
        doc.addPage();
        lastY = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 43, 69);
      doc.text('3. OBSERVAÇÕES GERAIS / CONSIDERAÇÕES FINAIS', 15, lastY + 12);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const splitText = doc.splitTextToSize(inspection.generalObservations, pageWith - 30);
      doc.text(splitText, 15, lastY + 19);
      lastY += 25 + (splitText.length * 4);
    }

    // Append photographic attachments in a grid format
    const allPhotos = inspection.areas.filter(a => a.photos && a.photos.length > 0);
    if (allPhotos.length > 0) {
      doc.addPage();
      doc.setFillColor(34, 43, 69);
      doc.rect(0, 0, pageWith, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ANEXO FOTOGRÁFICO - REGISTRO DE VISTORIA', 15, 10);

      let xOffset = 15;
      let yOffset = 25;
      const cardWidth = 85;
      const cardHeight = 65;

      allPhotos.forEach((area) => {
        area.photos.forEach((photo) => {
          // If exceeding page limits, add a page
          if (yOffset > 220) {
            doc.addPage();
            doc.setFillColor(34, 43, 69);
            doc.rect(0, 0, pageWith, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('ANEXO FOTOGRÁFICO - REGISTRO DE VISTORIA (Continuação)', 15, 10);
            yOffset = 25;
            xOffset = 15;
          }

          // Draw image box
          doc.setFillColor(248, 249, 250);
          doc.rect(xOffset, yOffset, cardWidth, cardHeight, 'F');
          
          try {
            // Draw real image inside cell
            doc.addImage(photo, 'JPEG', xOffset + 2, yOffset + 2, cardWidth - 4, cardHeight - 12);
          } catch (e) {
            // Placeholder cross sign if format is incompatible
            doc.setStrokeColor(220, 220, 220);
            doc.rect(xOffset + 2, yOffset + 2, cardWidth - 4, cardHeight - 12);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('[Imagem - Anexo Visual]', xOffset + 15, yOffset + 25);
          }

          // Label under the photo
          doc.setFillColor(43, 54, 85);
          doc.rect(xOffset, yOffset + cardHeight - 9, cardWidth, 9, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          
          // Truncate name
          let shortName = area.name;
          if (shortName.length > 22) shortName = shortName.substring(0, 19) + '...';
          doc.text(`${shortName} (${area.status.toUpperCase()})`, xOffset + 4, yOffset + cardHeight - 3);

          // Update grid coordinates (2 cards per row)
          if (xOffset === 15) {
            xOffset = pageWith - 15 - cardWidth;
          } else {
            xOffset = 15;
            yOffset += cardHeight + 10;
          }
        });
      });
    }

    // Save File
    const filename = `vistoria_imovel_${targetProperty.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    toast.success('Laudo técnico consolidado e baixado no formato PDF!');
  };

  const statusTags = {
    excellent: { label: 'Excelente', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    good: { label: 'Bom Estado', class: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    regular: { label: 'Regular', class: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    bad: { label: 'Ruim (Reparar)', class: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-white/10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white serif italic flex items-center gap-2">
            Vistorias por Foto
            <Badge className="bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider text-[9px] border border-indigo-500/30">
              Módulo Fotográfico
            </Badge>
          </h2>
          <p className="text-slate-400 font-medium mt-1 text-xs max-w-xl">
            Emita laudos fotográficos detalhados no momento da entrega das chaves (entrada) ou da desocupação (saída), garantindo segurança jurídica contra avarias no imóvel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full md:w-64 flex">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input 
              placeholder="Pesquisar por endereço ou imóvel..." 
              className="pl-11 h-11 border-white/10 bg-white/5 text-white rounded-xl shadow-xl shadow-slate-900/40 focus-visible:ring-indigo-500/50 transition-all text-xs font-bold placeholder:text-slate-500" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="h-11 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-xl shadow-indigo-500/25 transition-all font-bold px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer border border-indigo-400/20"
          >
            <Camera className="mr-2 h-4 w-4" />
            Nova Vistoria
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: CREATE NEW INSPECTION FORM */}
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-indigo-500/20 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-4 bg-indigo-500/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Novo Laudo Técnico de Vistoria
                  </CardTitle>
                  <p className="text-xs text-slate-400">Preencha os pareceres e tire fotos detalhadas de cada cômodo abaixo.</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-6 text-white space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Property Selector & Core Fields */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">Imóvel inspecionado</label>
                      <select 
                        required
                        value={selectedPropertyId}
                        onChange={(e) => {
                          setSelectedPropertyId(e.target.value);
                          const activeContract = contracts.find(c => c.propertyId === e.target.value && c.status === 'active');
                          if (activeContract) {
                            setSelectedContractId(activeContract.id);
                          } else {
                            setSelectedContractId('');
                          }
                        }}
                        className="w-full flex h-10 items-center justify-between rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-bold text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">-- Selecione um Imóvel --</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                            {p.title} ({p.address})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">Tipo de Laudo</label>
                      <select
                        value={inspectionType}
                        onChange={(e) => setInspectionType(e.target.value as any)}
                        className="w-full flex h-10 items-center justify-between rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-bold text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="entrada" className="bg-slate-900 text-white">Entrada (Garantia de Chaves)</option>
                        <option value="saida" className="bg-slate-900 text-white">Saída (Fechamento)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">Data da Vistoria</label>
                      <Input
                        type="date"
                        required
                        value={inspectionDate}
                        onChange={(e) => setInspectionDate(e.target.value)}
                        className="bg-slate-900/60 border-white/10 h-10 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">Nome do Vistoriador / Engenheiro responsável</label>
                      <Input
                        required
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        placeholder="Nome completo do vistor credenciado"
                        className="bg-slate-900/60 border-white/10 h-10 font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">E-mail para cópia de laudo</label>
                      <Input
                        type="email"
                        value={inspectorEmail}
                        onChange={(e) => setInspectorEmail(e.target.value)}
                        placeholder="corretor@portalalugafacil.com.br"
                        className="bg-slate-900/60 border-white/10 h-10 text-xs"
                      />
                    </div>
                  </div>

                  {/* Interactive Areas and Live Photograph Attachments */}
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#cfd3db] flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-pink-400" />
                        Pareceres individuais por Cômodo / Estrutura
                      </h4>
                      
                      {/* Add Dynamic Field custom section */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <Input 
                          placeholder="Adicionar outro cômodo... Ex: Sacada" 
                          value={newAreaName}
                          onChange={(e) => setNewAreaName(e.target.value)}
                          className="h-8 py-1 border-white/10 bg-slate-950 text-xs w-full sm:w-56"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddField}
                          className="h-8 border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10"
                        >
                          <Plus className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 border border-white/5 p-4 rounded-xl bg-slate-950/20">
                      {areas.map((area, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 grid gap-4 md:grid-cols-12 items-start relative hover:border-white/10 transition-colors duration-300">
                          
                          {/* Top Area metadata */}
                          <div className="md:col-span-3 space-y-1">
                            <h5 className="text-[11px] font-bold text-indigo-200 capitalize truncate" title={area.name}>{area.name}</h5>
                            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Conservação:</span>
                            <div className="flex gap-1 mt-1">
                              {['excellent', 'good', 'regular', 'bad'].map((statusOption) => {
                                const activeColorMap = {
                                  excellent: 'bg-emerald-500 text-white',
                                  good: 'bg-indigo-600 text-white',
                                  regular: 'bg-amber-500 text-white',
                                  bad: 'bg-rose-500 text-white'
                                };
                                const inactiveColorMap = {
                                  excellent: 'hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                                  good: 'hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
                                  regular: 'hover:bg-amber-500/20 text-amber-500 border border-amber-500/30',
                                  bad: 'hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                };
                                const isCurrent = area.status === statusOption;
                                return (
                                  <button
                                    key={statusOption}
                                    type="button"
                                    onClick={() => handleAreaChange(idx, 'status', statusOption as any)}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter cursor-pointer transition-all duration-200 ${
                                      isCurrent ? activeColorMap[statusOption as keyof typeof activeColorMap] : inactiveColorMap[statusOption as keyof typeof inactiveColorMap]
                                    }`}
                                  >
                                    {statusOption === 'excellent' ? 'Exc' : statusOption === 'good' ? 'Bom' : statusOption === 'regular' ? 'Reg' : 'Ruim'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Write comments and observations */}
                          <div className="md:col-span-4 space-y-1">
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Observações Técnicas / Danos detectados</span>
                            <textarea
                              rows={2}
                              value={area.comments}
                              onChange={(e) => handleAreaChange(idx, 'comments', e.target.value)}
                              placeholder="Filtros íntegros, ralos sem entupimento, pintura uniforme..."
                              className="w-full bg-slate-950/60 border border-white/5 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>

                          {/* Media attachments */}
                          <div className="md:col-span-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <ImageIcon className="h-3 w-3 text-cyan-400" />
                                Fotos ({area.photos.length})
                              </span>
                              {area.photos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleClearPhotos(idx)}
                                  className="text-[9px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest flex items-center gap-0.5 bg-rose-500/10 px-1 py-0.5 rounded cursor-pointer"
                                >
                                  Apagar
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {area.photos.map((p, pIdx) => (
                                <div key={pIdx} className="relative h-11 w-11 rounded-lg border border-white/10 overflow-hidden bg-slate-900 group">
                                  <img src={p} alt="inspection preview" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAreas(prev => {
                                        const clone = [...prev];
                                        clone[idx].photos = clone[idx].photos.filter((_, tempIdx) => tempIdx !== pIdx);
                                        return clone;
                                      });
                                    }}
                                    className="absolute inset-0 bg-red-600/70 items-center justify-center text-white hidden group-hover:flex"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Trigger file picker uploads or camera simulation */}
                              <div className="flex gap-1">
                                <label className="h-11 w-11 rounded-lg border border-dashed border-white/20 bg-slate-950 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-slate-900 transition-colors cursor-pointer" title="Anexar foto do celular/computador">
                                  <Plus className="h-4 w-4 text-slate-400" />
                                  <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handlePhotoUpload(idx, e)} 
                                  />
                                </label>
                                
                                {/* Simulation Camera Dropdown helpers */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-11 w-11 p-0 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-800"
                                        title="Simular Categoria Visual (Playground)"
                                      >
                                        <Camera className="h-4.5 w-4.5 text-indigo-400" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent className="frosted border-white/10 text-white w-52 max-md:w-48 align-end">
                                    <DropdownMenuItem onClick={() => handleSimulatePhoto(idx, 'excellent')} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 focus:bg-white/10">
                                      Anexar Foto "Excelente"
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSimulatePhoto(idx, 'regular')} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 focus:bg-white/10">
                                      Anexar Foto "Desgastada"
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSimulatePhoto(idx, 'bad')} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 focus:bg-white/10">
                                      Anexar Foto "Com Avaria"
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                            </div>
                          </div>

                          <div className="md:col-span-1 flex items-center justify-center self-center md:pt-4">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveField(idx)}
                              className="text-slate-500 hover:text-rose-400 h-8 w-8 rounded-full"
                              title="Remover cômodo do laudo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General observations text area */}
                  <div className="space-y-1.5 border-t border-white/5 pt-4">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">Observações Gerais / Cláusulas aditivas de reparos</label>
                    <textarea
                      rows={3}
                      value={generalObservations}
                      onChange={(e) => setGeneralObservations(e.target.value)}
                      placeholder="Declaro que além dos elementos pontuados, o imóvel se encontra completamente varrido, livre de lodos ou infiltrações ativas nos tetos, e que os armários planejados do quarto de casal estão com todas as chaves."
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-3 text-xs text-white focus:ring-indigo-500 focus:ring-2 focus:outline-none placeholder:text-slate-500"
                    />
                  </div>

                  {/* Submit Block buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsFormOpen(false);
                        setAreas([...DEFAULT_AREAS]);
                      }}
                      className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest px-8 shadow-lg shadow-indigo-950/20"
                    >
                      {isSubmitting ? 'Salvando Vistoria...' : 'Gravar Laudo e Finalizar'}
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspections Table List */}
      <div className="grid gap-6">
        {filteredInspections.length === 0 ? (
          <div className="frosted bg-white/5 border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center text-slate-400 border border-white/10 mb-4">
              <Camera className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Nenhuma vistoria encontrada</h4>
            <p className="text-slate-400 text-sm max-w-md">Não foram encontrados laudos fotográficos para o seu filtro ou pesquisas. Comece emitindo um novo laudo de vistoria no botão acima!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredInspections.map((inspection) => {
              const targetProperty = properties.find(p => p.id === inspection.propertyId);
              const totalPhotos = inspection.areas.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);
              
              const statusAverages = {
                excellent: inspection.areas.filter(a => a.status === 'excellent').length,
                good: inspection.areas.filter(a => a.status === 'good').length,
                regular: inspection.areas.filter(a => a.status === 'regular').length,
                bad: inspection.areas.filter(a => a.status === 'bad').length,
              };

              return (
                <Card key={inspection.id} className="overflow-hidden border-white/10 shadow-2xl backdrop-blur-md group hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-500 rounded-2xl bg-white/5 flex flex-col justify-between h-full border">
                  
                  {/* Card Main Block info */}
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge className={`${
                          inspection.type === 'entrada' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        } border-none font-black uppercase tracking-widest text-[8px] px-2 py-0.5`}>
                          Vistoria de {inspection.type === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                        <h4 className="text-[13px] font-bold text-white leading-tight uppercase italic serif pt-1 group-hover:text-indigo-400 transition-colors">
                          {targetProperty?.title || 'Imóvel Excluído'}
                        </h4>
                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest truncate">{targetProperty?.address || 'Endereço Indisponível'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 font-mono text-slate-500 text-[9px] uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {inspection.date.split('-').reverse().join('/')}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-b border-white/5 py-3 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-medium">Vistoriador credenciado</span>
                        <span className="text-white font-bold truncate max-w-[150px]">{inspection.inspectorName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-medium">Elementos auditados</span>
                        <span className="text-white font-bold">{inspection.areas.length} itens</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-medium">Fotos anexadas</span>
                        <span className="text-indigo-300 font-bold flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {totalPhotos} fotos
                        </span>
                      </div>
                    </div>

                    {/* Area condition distribution dashboard summary bar */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Distribuição Física do Laudo:</span>
                      <div className="flex h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        {statusAverages.excellent > 0 && <div className="bg-emerald-500" style={{ width: `${(statusAverages.excellent / inspection.areas.length) * 100}%` }} title="Excelentes" />}
                        {statusAverages.good > 0 && <div className="bg-sky-500" style={{ width: `${(statusAverages.good / inspection.areas.length) * 100}%` }} title="Bons" />}
                        {statusAverages.regular > 0 && <div className="bg-amber-500" style={{ width: `${(statusAverages.regular / inspection.areas.length) * 100}%` }} title="Regulares" />}
                        {statusAverages.bad > 0 && <div className="bg-rose-500" style={{ width: `${(statusAverages.bad / inspection.areas.length) * 100}%` }} title="Avariados" />}
                      </div>
                    </div>
                  </div>

                  {/* Print and view buttons */}
                  <div className="px-5 py-4 border-t border-white/5 bg-slate-950/20 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingInspection(inspection)}
                      className="flex-1 font-bold text-[10px] uppercase tracking-wider border-white/5 bg-white/5 text-white hover:bg-slate-800"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGeneratePDF(inspection)}
                      className="font-bold text-[10px] uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white min-w-[50px] shadow-lg"
                      title="Imprimir Laudo Completo (PDF)"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    {user?.role !== 'broker' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm('Excluir este laudo de vistoria? Esta ação é irreversível.')) {
                            await deleteInspection(inspection.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 h-9 w-9 p-0 rounded-lg shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEWING MODAL DETAILS SHEET */}
      <Dialog open={!!viewingInspection} onOpenChange={(open) => !open && setViewingInspection(null)}>
        {viewingInspection && (
          <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[92vh] flex flex-col frosted border-white/10 text-white overflow-hidden p-0">
            <DialogHeader className="p-5 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 bg-indigo-500/5">
              <div>
                <DialogTitle className="serif italic text-2xl text-white">
                  Detalhes do Laudo de Vistoria
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  Laudo técnico documentando vistoria de {viewingInspection.type === 'entrada' ? 'entrada (entrega das chaves)' : 'saída (fim de locação)'}
                </DialogDescription>
              </div>
              <div className="flex gap-2.5 mt-2 md:mt-0">
                <Button
                  size="sm"
                  onClick={() => handleGeneratePDF(viewingInspection)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 h-9 shadow-lg"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Gerar PDF Oficial
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setViewingInspection(null)}
                  className="text-slate-400 hover:text-white rounded-full bg-slate-900 border border-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
              
              {/* Meta Property layout grid */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-widest">Imóvel Inspecionado</span>
                  <h4 className="text-sm font-bold mt-1 text-white">
                    {properties.find(p => p.id === viewingInspection.propertyId)?.title || 'Imóvel Excluído'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {properties.find(p => p.id === viewingInspection.propertyId)?.address || 'Endereço indisponível'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Data da Vistoria</span>
                    <span className="text-white font-bold font-mono text-xs">{viewingInspection.date.split('-').reverse().join('/')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Vistoriador</span>
                    <span className="text-white font-bold text-xs truncate max-w-[120px] block" title={viewingInspection.inspectorName}>{viewingInspection.inspectorName}</span>
                  </div>
                </div>
              </div>

              {/* checklist items rendering */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#cfd3db] pb-2 border-b border-white/5">
                  Pareceres por Côte / Cômodo
                </h4>
                
                <div className="space-y-4">
                  {viewingInspection.areas.map((area, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <span className="font-bold text-xs text-slate-200 capitalize">{area.name}</span>
                        <Badge className={`${statusTags[area.status]?.class} border font-bold text-[9px] uppercase tracking-widest px-2 py-0.5`}>
                          {statusTags[area.status]?.label || area.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed italic pr-4">
                        {area.comments || '(Sem observações adicionais relatadas}'}
                      </p>

                      {/* Display attached images if they exist */}
                      {area.photos && area.photos.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-3 pt-3 border-t border-white/5">
                          {area.photos.map((photo, pIdx) => (
                            <div 
                              key={pIdx} 
                              className="relative aspect-square rounded-lg border border-white/10 overflow-hidden bg-slate-900 group cursor-pointer hover:border-indigo-400 transition-all"
                              onClick={() => {
                                if ((window as any).__showDocumentPreview) {
                                  (window as any).__showDocumentPreview(photo, `${area.name} - Imagem ${pIdx + 1}`);
                                }
                              }}
                            >
                              <img src={photo} alt="Attached Inspection" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/60 hidden group-hover:flex items-center justify-center text-white text-[9px] font-bold">
                                Ampliar
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* General observations details showing */}
              {viewingInspection.generalObservations && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">
                    Considerações Finais / Observações Gerais
                  </h4>
                  <p className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed italic">
                    {viewingInspection.generalObservations}
                  </p>
                </div>
              )}

            </div>
          </DialogContent>
        )}
      </Dialog>

    </div>
  );
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface BoletoData {
  id: string;
  tenantName: string;
  tenantCpf: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  barcode: string;
  digitableLine: string;
}

export const generateBoletoPDF = (data: BoletoData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text('BANCO ALUGAFÁCIL | 001-9', 10, 20);
  
  doc.setFontSize(10);
  doc.text(data.digitableLine, 80, 20);
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(10, 25, 200, 25);
  
  // Table info
  autoTable(doc, {
    startY: 30,
    head: [['Local de Pagamento', 'Vencimento']],
    body: [['PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO', format(new Date(data.dueDate), 'dd/MM/yyyy')]],
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['Beneficiário', 'Agência/Código Beneficiário']],
    body: [['AlugaFácil Gestão Imobiliária LTDA - 12.345.678/0001-90', '1234-5 / 67890-1']],
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['Data do Documento', 'Nº Documento', 'Espécie DOC', 'Aceite', 'Data Processamento']],
    body: [[format(new Date(), 'dd/MM/yyyy'), data.id.substring(0, 8), 'RC', 'N', format(new Date(), 'dd/MM/yyyy')]],
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['Uso do Banco', 'Carteira', 'Espécie', 'Quantidade', 'Valor', '(=) Valor do Documento']],
    body: [['', '17', 'R$', '', '', data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['Instruções (Texto de responsabilidade do beneficiário)']],
    body: [
      [`REFERENTE À LOCAÇÃO DO IMÓVEL: ${data.propertyAddress}`],
      ['SR. CAIXA, NÃO RECEBER APÓS O VENCIMENTO.'],
      ['APÓS O VENCIMENTO COBRAR MORA DIÁRIA DE R$ 5,00 E MULTA DE 10%.'],
    ],
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['Pagador']],
    body: [
      [`${data.tenantName} - CPF: ${data.tenantCpf}`],
      ['ENDERÊÇO DO PAGADOR: Logradouro do locatário, 123 - Cidade/UF - CEP: 00000-000'],
    ],
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  // Fake Barcode (just representing it with a rectangle and text)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setDrawColor(0);
  doc.rect(10, finalY, 180, 20);
  doc.setFontSize(8);
  doc.text('CÓDIGO DE BARRAS (SIMULADO)', 15, finalY + 12);
  doc.text(data.barcode, 15, finalY + 18);
  
  doc.save(`Boleto_${data.tenantName.replace(/\s/g, '_')}_${data.id.substring(0, 5)}.pdf`);
};

export const boletoService = {
  async generateForPayment(payment: any, tenant: any, property: any) {
    // In a real scenario, this would call an API like Asaas
    // For now, we mock the barcode and digitable line
    const data: BoletoData = {
      id: payment.id,
      tenantName: tenant.name,
      tenantCpf: tenant.cpf,
      propertyAddress: property.address,
      amount: payment.amount,
      dueDate: payment.dueDate,
      barcode: '00190500954014481606906809350314337370000000100',
      digitableLine: '00190.50095 40144.816069 06809.350314 3 37370000000100'
    };
    
    generateBoletoPDF(data);
  }
};

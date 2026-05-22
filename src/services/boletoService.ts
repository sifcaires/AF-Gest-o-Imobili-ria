import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface BoletoData {
  id: string;
  tenantName: string;
  tenantCpf: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  barcode: string;
  digitableLine: string;
  title?: string;
  penaltyPercent?: number;
  interestPercent?: number;
  discountAmount?: number;
  instructions?: string;
}

export const generateBoletoPDF = (data: BoletoData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Outer margin boundaries: x=10 to x=200 (width=190mm)
  
  // FIRST PART: Recibo do Pagador (Holder receipt)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 30, 48); // Navy blue accent
  doc.text('BANCO ALUGAFÁCIL', 10, 15);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('|  001-9', 58, 15);
  doc.text('RECIBO DO PAGADOR', 150, 15);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(10, 18, 200, 18);
  
  // Pagador details
  autoTable(doc, {
    startY: 20,
    margin: { left: 10, right: 10 },
    head: [['Beneficiário', 'Espécie', 'Vencimento', 'Valor cobrado']],
    body: [[
      'AlugaFácil Gestão Imobiliária LTDA - CNPJ: 12.345.678/0001-90\nAgência/Cód: 1234-5 / 67890-1',
      data.title || 'Aluguel Mensal',
      format(new Date(data.dueDate), 'dd/MM/yyyy'),
      data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]],
    theme: 'grid',
    styles: { fontSize: 8, font: 'Helvetica', textColor: [40, 40, 40] },
    headStyles: { fillColor: [245, 247, 250], textColor: [70, 80, 95], fontStyle: 'bold' }
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    margin: { left: 10, right: 10 },
    head: [['Pagador / Sacado', 'Imóvel de Referência', 'Nosso Número']],
    body: [[
      `${data.tenantName} - CPF: ${data.tenantCpf}`,
      data.propertyAddress,
      `${data.id.substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 9)}`
    ]],
    theme: 'grid',
    styles: { fontSize: 8, font: 'Helvetica', textColor: [40, 40, 40] },
    headStyles: { fillColor: [245, 247, 250], textColor: [70, 80, 95], fontStyle: 'bold' }
  });

  const instructionsList: string[] = [];
  instructionsList.push(`Referente a: ${data.title || 'Aluguel Residencial/Comercial'}`);
  instructionsList.push(`Imóvel: ${data.propertyAddress}`);
  
  if (data.penaltyPercent && data.penaltyPercent > 0) {
    instructionsList.push(`APÓS VENCIMENTO: Cobrar multa de ${data.penaltyPercent}%`);
  }
  if (data.interestPercent && data.interestPercent > 0) {
    const dailyInterest = (data.amount * (data.interestPercent / 100)) / 30;
    instructionsList.push(`APÓS VENCIMENTO: Cobrar juros de ${data.interestPercent}% ao mês (R$ ${dailyInterest.toFixed(2)} por dia de atraso)`);
  }
  if (data.discountAmount && data.discountAmount > 0) {
    instructionsList.push(`ATÉ O VENCIMENTO: Conceder desconto pontualidade de ${data.discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  }
  if (data.instructions) {
    instructionsList.push(`Instruções Adicionais: ${data.instructions}`);
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    margin: { left: 10, right: 10 },
    head: [['Instruções e Demonstrativos']],
    body: instructionsList.map(inst => [inst]),
    theme: 'grid',
    styles: { fontSize: 8, font: 'Helvetica', textColor: [60, 60, 60] },
    headStyles: { fillColor: [245, 247, 250], textColor: [70, 80, 95], fontStyle: 'bold' }
  });
  
  // Cut line
  const cutY = (doc as any).lastAutoTable.finalY + 10;
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, cutY, 200, cutY);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('Helvetica', 'normal');
  doc.text('Corte na linha pontilhada para pagamento em lotéricas ou caixas eletrônicos', 10, cutY - 2);
  doc.text('✁ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 10, cutY + 3);
  
  // SECOND PART: Ficha de Compensação (Bank copy slip)
  doc.setLineDashPattern([], 0); // Reset dash style
  
  const slipStartY = cutY + 12;
  
  // Bank Logo & Details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 30, 48);
  doc.text('BANCO ALUGAFÁCIL', 10, slipStartY);
  doc.text('001-9', 65, slipStartY);
  
  // Vertical bold line dividers for Bank slip standard layout
  doc.setLineWidth(1.2);
  doc.line(60, slipStartY - 4, 60, slipStartY + 2);
  doc.line(80, slipStartY - 4, 80, slipStartY + 2);
  
  // Digitable line on top right
  doc.setFont('Courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(data.digitableLine, 83, slipStartY);
  
  // Standard grid for bank slip
  autoTable(doc, {
    startY: slipStartY + 4,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7, font: 'Helvetica', cellPadding: 1.5 },
    headStyles: { fillColor: [245, 247, 250], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columns: [
      { header: 'Local de Pagamento', dataKey: 'local' },
      { header: 'Vencimento', dataKey: 'vencimento' }
    ],
    body: [[
      'PAGÁVEL EM QUALQUER AGÊNCIA BANCÁRIA OU CANAL DIGITAL ATÉ O VENCIMENTO', 
      format(new Date(data.dueDate), 'dd/MM/yyyy')
    ]],
    columnStyles: {
      local: { cellWidth: 140 },
      vencimento: { cellWidth: 50, fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0], halign: 'right' }
    }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7, font: 'Helvetica', cellPadding: 1.5 },
    headStyles: { fillColor: [245, 247, 250], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columns: [
      { header: 'Beneficiário', dataKey: 'beneficiary' },
      { header: 'Agência / Código Beneficiário', dataKey: 'agency' }
    ],
    body: [[
      'AlugaFácil Gestão Imobiliária LTDA - CNPJ: 12.345.678/0001-90',
      '1234-5 / 67890-1'
    ]],
    columnStyles: {
      beneficiary: { cellWidth: 140 },
      agency: { cellWidth: 50, halign: 'right' }
    }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7, font: 'Helvetica', cellPadding: 1.5 },
    headStyles: { fillColor: [245, 247, 250], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columns: [
      { header: 'Data do Doc.', dataKey: 'dateDoc' },
      { header: 'Nº do Documento', dataKey: 'numDoc' },
      { header: 'Espécie Doc.', dataKey: 'espDoc' },
      { header: 'Aceite', dataKey: 'aceite' },
      { header: 'Data Proc.', dataKey: 'dateProc' },
      { header: 'Carteira / Nosso Número', dataKey: 'nossoNum' }
    ],
    body: [[
      format(new Date(), 'dd/MM/yyyy'),
      data.id.substring(0, 8).toUpperCase(),
      'RC',
      'N',
      format(new Date(), 'dd/MM/yyyy'),
      `17 / ${data.id.substring(0, 8).toUpperCase()}`
    ]],
    columnStyles: {
      dateDoc: { cellWidth: 25 },
      numDoc: { cellWidth: 35 },
      espDoc: { cellWidth: 20 },
      aceite: { cellWidth: 15 },
      dateProc: { cellWidth: 25 },
      nossoNum: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
    }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7, font: 'Helvetica', cellPadding: 1.5 },
    headStyles: { fillColor: [245, 247, 250], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columns: [
      { header: 'Uso do Banco', dataKey: 'uso' },
      { header: 'Carteira', dataKey: 'carteira' },
      { header: 'Espécie', dataKey: 'especie' },
      { header: 'Quantidade', dataKey: 'quantidade' },
      { header: 'Valor Unitário', dataKey: 'unitario' },
      { header: '(=) Valor do Documento', dataKey: 'documentAmount' }
    ],
    body: [[
      '',
      '17',
      'R$',
      '',
      '',
      data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]],
    columnStyles: {
      uso: { cellWidth: 30 },
      carteira: { cellWidth: 20 },
      especie: { cellWidth: 20 },
      quantidade: { cellWidth: 25 },
      unitario: { cellWidth: 45 },
      documentAmount: { cellWidth: 50, halign: 'right', fontStyle: 'bold', fontSize: 9, textColor: [0, 0, 0] }
    }
  });

  // Instructions & calculations grid
  const mainInstructions: string[] = [
    `SACADO: ${data.tenantName} - CPF: ${data.tenantCpf}`,
    `REFERENTE À LOCAÇÃO DO IMÓVEL: ${data.propertyAddress}`,
    `SR. CAIXA, NÃO RECEBER APÓS O VENCIMENTO.`
  ];
  
  if (data.penaltyPercent && data.penaltyPercent > 0) {
    mainInstructions.push(`MANDATÓRIO: APÓS O VENCIMENTO COBRAR MULTA DE ${data.penaltyPercent}% (R$ ${(data.amount * (data.penaltyPercent / 100)).toFixed(2)})`);
  }
  if (data.interestPercent && data.interestPercent > 0) {
    const dailyInterest = (data.amount * (data.interestPercent / 100)) / 30;
    mainInstructions.push(`MANDATÓRIO: COBRAR JUROS DE MORA DE ${data.interestPercent}% AO MÊS (R$ ${dailyInterest.toFixed(2)} POR DIA DE ATRASO)`);
  }
  if (data.discountAmount && data.discountAmount > 0) {
    mainInstructions.push(`DESCONTO: CONCEDER DESCONTO DE ${data.discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} SE PAGO ATÉ O VENCIMENTO`);
  }
  if (data.instructions) {
    mainInstructions.push(`INSTRUÇÕES ADICIONAIS: ${data.instructions}`);
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7, font: 'Helvetica', cellPadding: 1.5 },
    headStyles: { fillColor: [245, 247, 250], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columns: [
      { header: 'Instruções (Todas as informações deste bloqueto são de exclusiva responsabilidade do beneficiário)', dataKey: 'insts' },
      { header: 'Demonstrativo de Valores Adicionais', dataKey: 'vals' }
    ],
    body: [
      [mainInstructions.join('\n'), '(-) Desconto / Abatimento: \n\n(+) Mora / Multa: \n\n(=) Valor Cobrado: ']
    ],
    columnStyles: {
      insts: { cellWidth: 140, fontSize: 6.5, textColor: [50, 50, 50] },
      vals: { cellWidth: 50, fontSize: 6.5, textColor: [120, 120, 120] }
    }
  });

  // Pagador Box
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7, font: 'Helvetica', cellPadding: 1.2 },
    headStyles: { fillColor: [245, 247, 250], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columns: [
      { header: 'Pagador', dataKey: 'pagadorInfo' }
    ],
    body: [[
      `${data.tenantName} - CPF/CNPJ: ${data.tenantCpf}\nEnderêço: Logradouro cadastrado, nº 123 - CEP: 00000-000 - Célula Habitacional Referenciada`
    ]],
    columnStyles: {
      pagadorInfo: { cellWidth: 190, fontSize: 7, textColor: [30, 30, 30] }
    }
  });
  
  // REALISTIC BARCODE GENERATION
  // Standard bar code width in mm: 160mm, starting from x=15mm. Height: 15mm.
  const barcodeX = 15;
  const barcodeY = (doc as any).lastAutoTable.finalY + 6;
  const barcodeHeight = 15;
  
  doc.setFillColor(0, 0, 0); // Black fill
  
  // We'll generate a realistic-looking Code-128 / Interleaved 2 of 5 style barcode structure
  // by looping and drawing stripes of varying widths:
  // narrow = 0.3mm, wide = 0.8mm, gaps are also narrow or wide.
  let currentX = barcodeX;
  const stripeSchema = [
    1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 4, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 4, 2, 1, 1,
    3, 1, 2, 1, 2, 1, 4, 1, 1, 3, 1, 2, 1, 1, 3, 4, 1, 1, 2, 1, 2, 1, 3, 1, 2,
    1, 1, 4, 1, 2, 1, 1, 3, 1, 2, 1, 4, 2, 1, 1, 3, 1, 1, 2, 1, 2, 4, 1, 1, 3,
    1, 2, 1, 1, 3, 1, 2, 1, 4, 2, 1, 1, 3, 1, 1, 2, 1, 2, 4, 1, 1, 3, 1, 2, 1,
    1, 3, 1, 2, 1, 4, 2, 1, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 4, 2, 1, 1, 3, 1, 1,
  ];

  for (let i = 0; i < stripeSchema.length; i++) {
    const spaceWidth = stripeSchema[i] * 0.4;
    const barWidth = stripeSchema[(i + 3) % stripeSchema.length] * 0.45;
    
    // Draw Bar
    doc.rect(currentX, barcodeY, barWidth, barcodeHeight, 'F');
    currentX += barWidth + spaceWidth;
  }
  
  // Barcode numbers under barcode
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(data.barcode, 15, barcodeY + barcodeHeight + 4);
  
  // Save Document
  doc.save(`Boleto_${data.tenantName.replace(/\s/g, '_')}_${data.id.substring(0, 8)}.pdf`);
};

export const boletoService = {
  async generateForPayment(payment: any, tenant: any, property: any) {
    const fallbackTitle = 'Aluguel Mensal';
    // Incorporate expanded boleto parameters
    const data: BoletoData = {
      id: payment.id,
      tenantName: tenant.name,
      tenantCpf: tenant.cpf,
      propertyAddress: property.address,
      amount: payment.amount,
      dueDate: payment.dueDate,
      barcode: '00190500954014481606906809350314337370000000100',
      digitableLine: '00190.50095 40144.816069 06809.350314 3 37370000000100',
      title: payment.title || fallbackTitle,
      penaltyPercent: payment.penaltyPercent !== undefined ? payment.penaltyPercent : 10,
      interestPercent: payment.interestPercent !== undefined ? payment.interestPercent : 1,
      discountAmount: payment.discountAmount !== undefined ? payment.discountAmount : 0,
      instructions: payment.instructions || ''
    };
    
    generateBoletoPDF(data);
  }
};

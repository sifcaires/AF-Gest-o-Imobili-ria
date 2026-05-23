import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import QRCode from 'qrcode';

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
  beneficiaryName?: string;
  beneficiaryCpfCnpj?: string;
  beneficiaryEmail?: string;
  beneficiaryPixKey?: string;
}

// CRC16 Calculation for EMV/BRCode standard Pix payload validation
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    crc ^= (charCode << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function cleanPixKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.includes('@')) {
    return trimmed; // Email
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed; // UUID
  }
  const clean = trimmed.replace(/[^a-zA-Z0-9+]/g, '');
  if (clean.startsWith('+')) {
    return clean;
  }
  if (/^\d+$/.test(clean) && (clean.length === 11 || clean.length === 14)) {
    return clean; // CPF/CNPJ
  }
  if (/^\d{10,11}$/.test(clean)) {
    return `+55${clean}`; // Phone
  }
  return clean;
}

function buildMerchantAccount(pixKey: string): string {
  const cleanedKey = cleanPixKey(pixKey || 'financeiro@alugafacil.com.br');
  const partGui = '0014br.gov.bcb.pix';
  const partKey = `01${String(cleanedKey.length).padStart(2, '0')}${cleanedKey}`;
  const partDesc = '0208ALUGAFAC';
  
  const content = `${partGui}${partKey}${partDesc}`;
  return `26${String(content.length).padStart(2, '0')}${content}`;
}

/**
 * Generates an EMV compliant Pix Copy and Paste string dynamically
 */
export function generatePixCode(amount: number, paymentId: string, tenantName: string, pixKey?: string): string {
  const amountStr = amount.toFixed(2);
  // Alphanumeric txid restricted to 25 chars
  const txid = `ALUGA${paymentId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15).toUpperCase()}`;
  
  const elPayloadFormat = '000201';
  // Chave Pix customizada ou fallback do sistema
  const elMerchantAccount = buildMerchantAccount(pixKey || 'financeiro@alugafacil.com.br');
  const elCategoryCode = '52040000';
  const elCurrency = '5303986';
  const elAmount = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
  const elCountry = '5802BR';
  // Standard upper-case ASCII merchant name
  const rawName = tenantName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const cleanName = (rawName.substring(0, 15) || 'ALUGAFACIL GESTAO').trim();
  const elMerchantName = `59${String(cleanName.length).padStart(2, '0')}${cleanName}`;
  const elMerchantCity = '6009SAO PAULO';
  const elAdditionalData = `62${String(4 + txid.length).padStart(2, '0')}05${String(txid.length).padStart(2, '0')}${txid}`;
  
  const incompleteCode = `${elPayloadFormat}${elMerchantAccount}${elCategoryCode}${elCurrency}${elAmount}${elCountry}${elMerchantName}${elMerchantCity}${elAdditionalData}6304`;
  const crc = calculateCRC16(incompleteCode);
  return `${incompleteCode}${crc}`;
}

export const generateBoletoPDF = async (data: BoletoData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pixCode = generatePixCode(data.amount, data.id, data.tenantName, data.beneficiaryPixKey);
  
  // Generate QR Code as high-res PNG Base64
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
      margin: 1,
      width: 300,
      color: {
        dark: '#4f46e5', // Deep elegant Indigo brand accent color
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR Code for PDF', err);
  }

  // Visual header: Indigo colored premium banner
  doc.setFillColor(79, 70, 229); // Brand Indigo: oklch(0.58 0.16 245)
  doc.rect(10, 10, 190, 32, 'F');
  
  // Header Text
  doc.setFont('Helvetica', 'bold');
  let fontSize = 15;
  doc.setFontSize(fontSize);
  doc.setTextColor(255, 255, 255);
  
  let displayBeneficiary = data.beneficiaryName || '';
  let headerName = displayBeneficiary ? `ALUGAFÁCIL | ${displayBeneficiary.toUpperCase()}` : 'ALUGAFÁCIL';
  
  // Dynamically shrink the font size first from 15 down to 10 to fit the available space (95 mm max)
  while (fontSize > 10 && doc.getTextWidth(headerName) > 95) {
    fontSize -= 0.5;
    doc.setFontSize(fontSize);
  }
  
  // If even at size 10 it's too wide, truncate the beneficiary name character by character until it fits
  if (doc.getTextWidth(headerName) > 95 && displayBeneficiary) {
    while (displayBeneficiary.length > 3 && doc.getTextWidth(headerName) > 95) {
      displayBeneficiary = displayBeneficiary.slice(0, -1);
      headerName = `ALUGAFÁCIL | ${displayBeneficiary.toUpperCase()}...`;
    }
  }
  
  // Draw the perfectly adjusted text
  doc.text(headerName, 16, 22);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text('GESTÃO INTELIGENTE DE CONTRATOS E RECEBIMENTOS', 16, 28);
  
  const cnpj = data.beneficiaryCpfCnpj || '12.345.678/0001-90';
  const email = data.beneficiaryEmail || 'contato@alugafacil.com.br';
  doc.text(`CPF/CNPJ: ${cnpj} | E-mail: ${email}`, 16, 33);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('FATURA DIGITAL SINALIZADA VIA PIX', 192, 22, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.text(`VENCIMENTO: ${format(new Date(data.dueDate), 'dd/MM/yyyy')}`, 192, 28, { align: 'right' });
  doc.text(`NÚMERO: #${data.id.substring(0, 8).toUpperCase()}`, 192, 33, { align: 'right' });

  // Spacer
  let currentY = 50;

  // Title section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Demonstrativo de Cobrança de Aluguel', 10, currentY);
  
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.setLineWidth(0.5);
  doc.line(10, currentY + 3, 200, currentY + 3);
  
  currentY += 8;

  // Beneficiary and payer details grid
  autoTable(doc, {
    startY: currentY,
    margin: { left: 10, right: 10 },
    head: [['Identificação do Locatário / Pagador', 'Imóvel Referente']],
    body: [[
      `Nome: ${data.tenantName}\nDocumento CPF: ${data.tenantCpf}\nE-mail: cadastrado@sistema.alugafacil`,
      `${data.propertyAddress}`
    ]],
    theme: 'grid',
    styles: { fontSize: 8.5, font: 'Helvetica', textColor: [30, 41, 59], cellPadding: 3 },
    headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', lineWidth: 0.3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Payment Values Detail Block
  autoTable(doc, {
    startY: currentY,
    margin: { left: 10, right: 10 },
    head: [['Rubrica / Descrição', 'Vencimento', 'Condições Moratórias', 'Subtotal Cobrado']],
    body: [[
      data.title || 'Aluguel Residencial/Comercial Mensal',
      format(new Date(data.dueDate), 'dd/MM/yyyy'),
      (data.penaltyPercent ? `Multa de ${data.penaltyPercent}% após venc.\n` : '') +
      (data.interestPercent ? `Mora de ${data.interestPercent}% ao mês (juros diários)` : 'Sem juros extras'),
      data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]],
    theme: 'grid',
    styles: { fontSize: 8.5, font: 'Helvetica', textColor: [30, 41, 59], cellPadding: 3.5 },
    headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', lineWidth: 0.3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // DEDICATED PIX PAYMENT SECTION (Modern elegant visual card container)
  doc.setDrawColor(79, 70, 229); // Purple/indigo border
  doc.setLineWidth(0.8);
  // Rounded rectangle background or framed box (W: 190mm, H: 85mm)
  doc.setFillColor(250, 251, 254);
  doc.rect(10, currentY, 190, 80, 'FD');

  // Title within Pix box
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text('PAGAMENTO EXPRESSO VIA PIX', 16, currentY + 7);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Esta fatura está integrada com a rede Pix do Banco Central do Brasil. Pague a tempo e evite multas.', 16, currentY + 12);

  // Print QR Code if available
  if (qrCodeDataUrl) {
    // Drawn at center left (x=20, y=currentY+18, size=48mm)
    doc.addImage(qrCodeDataUrl, 'PNG', 20, currentY + 18, 48, 48);
  } else {
    // Fallback QR card background box
    doc.setDrawColor(203, 213, 225);
    doc.rect(20, currentY + 18, 48, 48);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('QR Code Indisponível\nUtilize o Pix Copia e Cola', 44, currentY + 40, { align: 'center' });
  }

  // Contextual Pix Instructions at right of QR Code
  const instrX = 75;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('COMO FAZER O PAGAMENTO:', instrX, currentY + 23);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('1. Acesse o aplicativo do seu banco de preferência.', instrX, currentY + 29);
  doc.text('2. Escolha a opção de pagar através de Pix / "Ler QR Code".', instrX, currentY + 34);
  doc.text('3. Aponte a câmera do celular para o código QR à esquerda ou...', instrX, currentY + 39);
  doc.text('4. Se estiver no celular, copie a linha abaixo correspondente ao Copia e Cola.', instrX, currentY + 44);

  // Copy-paste block Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('PIX COPIA E COLA (CHAVE DINÂMICA):', instrX, currentY + 52);

  // Multi-line Copy-Paste TextBox background
  doc.setFillColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.setDrawColor(203, 213, 225);
  doc.rect(instrX, currentY + 55, 115, 20, 'FD');

  // Draw Pix Copy & Paste string wrapped beautifully inside the grey text box
  doc.setFont('Courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  const splitPixCode = doc.splitTextToSize(pixCode, 111);
  doc.text(splitPixCode, instrX + 2, currentY + 59);

  currentY += 88;

  // Custom landlord instructions sheet
  const instructionsList: string[] = [];
  if (data.penaltyPercent && data.penaltyPercent > 0) {
    instructionsList.push(`- Cobrança automática de Multa Moratória de ${data.penaltyPercent}% caso ocorra inadimplência de prazo.`);
  }
  if (data.interestPercent && data.interestPercent > 0) {
    const dailyInterest = (data.amount * (data.interestPercent / 100)) / 30;
    instructionsList.push(`- Encargos diários pós-vencimento: Taxa mensal de ${data.interestPercent}% (equivalente a R$ ${dailyInterest.toFixed(2)} por dia).`);
  }
  if (data.discountAmount && data.discountAmount > 0) {
    instructionsList.push(`- Bonificação: Desconto de Pontualidade de ${data.discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} concedido automaticamente para pagamentos liquidados até a data de vencimento correspondente.`);
  }
  if (data.instructions) {
    instructionsList.push(`- Observações da Administração Imobiliária: ${data.instructions}`);
  }

  if (instructionsList.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Observações Adicionais e Política de Recebimentos:', 10, currentY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    let lineOffsetY = currentY + 4;
    instructionsList.forEach((inst) => {
      // split to avoid overflow
      const splitInst = doc.splitTextToSize(inst, 190);
      doc.text(splitInst, 10, lineOffsetY);
      lineOffsetY += (splitInst.length * 3.5);
    });
  }

  // Footer visual clean signature
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(10, 275, 200, 275);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Esta é uma fatura 100% ecológica e segura. Realizada no ecossistema integrado Pix Banco Central do Brasil.', 10, 280);
  doc.text('AlugaFácil Tecnologia Ltda. Soluções e Relacionamentos Imobiliários e Residenciais S/A.', 10, 284);
  doc.text('PÁGINA 1/1 DE DOCUMENTAÇÃO DE COBRANÇA', 200, 280, { align: 'right' });

  // Save Document with customized title reflecting Pix
  doc.save(`Fatura_Pix_${data.tenantName.replace(/\s/g, '_')}_${data.id.substring(0, 8)}.pdf`);
};

export const boletoService = {
  // Keep same method interface with optional beneficiary parameter to support customization
  async generateForPayment(payment: any, tenant: any, property: any, beneficiary?: any) {
    const fallbackTitle = 'Aluguel Mensal';
    const data: BoletoData = {
      id: payment.id,
      tenantName: tenant.name,
      tenantCpf: tenant.cpf,
      propertyAddress: property.address,
      amount: payment.amount,
      dueDate: payment.dueDate,
      barcode: payment.id, // Reused fields
      digitableLine: generatePixCode(payment.amount, payment.id, tenant.name, beneficiary?.pixKey),
      title: payment.title || fallbackTitle,
      penaltyPercent: payment.penaltyPercent !== undefined ? payment.penaltyPercent : 10,
      interestPercent: payment.interestPercent !== undefined ? payment.interestPercent : 1,
      discountAmount: payment.discountAmount !== undefined ? payment.discountAmount : 0,
      instructions: payment.instructions || '',
      beneficiaryName: beneficiary?.name,
      beneficiaryCpfCnpj: beneficiary?.cpfCnpj,
      beneficiaryEmail: beneficiary?.email,
      beneficiaryPixKey: beneficiary?.pixKey
    };
    
    await generateBoletoPDF(data);
  }
};

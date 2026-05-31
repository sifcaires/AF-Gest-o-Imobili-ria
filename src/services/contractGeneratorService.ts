import { jsPDF } from 'jspdf';
import { Contract, Property, Tenant, Landlord } from '../types';

export interface ContractGenerationOptions {
  contractType: 'residential' | 'commercial';
  warrantyType: 'deposit' | 'guarantor' | 'none';
  warrantyValue?: string; // e.g. "R$ 5.000,00" or details of the guarantor
  customClauses?: string;
  readjustmentIndex: 'IGP-M' | 'IPCA' | 'Sem Reajuste';
  commercialActivity?: string; // specifically for commercial
}

export const contractGeneratorService = {
  getTemplateText(
    contract: Contract,
    property: Property,
    tenant: Tenant,
    landlord: Landlord,
    options: ContractGenerationOptions
  ): { title: string; sections: { title: string; content: string }[] } {
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '__/__/____';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const startFormatted = formatDate(contract.startDate);
    const endFormatted = formatDate(contract.endDate);
    const rentFormatted = formatCurrency(contract.rentAmount);

    const title = options.contractType === 'commercial' 
      ? 'CONTRATO DE LOCAÇÃO COMERCIAL'
      : 'CONTRATO DE LOCAÇÃO RESIDENCIAL';

    // Build parts
    const sections: { title: string; content: string }[] = [];

    // Qualification
    sections.push({
      title: 'DAS PARTES CONTRATANTES',
      content: `LOCADOR(A): ${landlord.name}, inscrito(a) sob o CPF/CNPJ n.º ${landlord.cpfCnpj}, residente no endereço ${landlord.address || 'não informado'}, doravante denominado simplesmente LOCADOR.\n\n` +
               `LOCATÁRIO(A): ${tenant.name}, inscrito(a) sob o CPF n.º ${tenant.cpf}, RG n.º ${tenant.rg || 'não informado'}, residente e domiciliado(a) profissionalmente no endereço ${tenant.address || 'não informado'}, doravante denominado simplesmente LOCATÁRIO.\n\n` +
               `As partes qualificadas acima celebram e ajustam o presente contrato de locação de imóvel urbano, amparado pela Lei n.º 8.245 de 18 de Outubro de 1991 e demais disposições aplicáveis do Código Civil.`
    });

    // Object
    sections.push({
      title: 'CLÁUSULA PRIMEIRA - DO OBJETO E DESTINAÇÃO',
      content: `O presente contrato tem como objeto a locação do imóvel localizado na ${property.address}, especificado como: "${property.title}" (${property.description || 'Imóvel Urbano'}).\n\n` +
               (options.contractType === 'commercial'
                 ? `Parágrafo Único: O imóvel destina-se exclusivamente para fins comerciais, para a exploração da atividade de: "${options.commercialActivity || 'Comércio em Geral'}", sendo expressamente vedada qualquer alteração de finalidade ou sublocação sem anuência prévia e por escrito do LOCADOR.`
                 : `Parágrafo Único: O imóvel locado destina-se única e exclusivamente para fins de moradia e residência do LOCATÁRIO e sua família, sendo vedado dar-lhe destinação diversa sob pena de rescisão de pleno direito deste instrumento.`)
    });

    // Duration
    sections.push({
      title: 'CLÁUSULA SEGUNDA - DA VIGÊNCIA E DA PRORROGAÇÃO',
      content: `O prazo de locação é determinado, iniciando-se em ${startFormatted} e com término em ${endFormatted}.\n\n` +
               `Parágrafo Primeiro: Findo o prazo estipulado, o contrato poderá ser prorrogado mediante acordo mútuo por escrito dos contratantes.\n\n` +
               `Parágrafo Segundo: Caso o LOCATÁRIO pretenda desocupar o imóvel ao término contratual, deverá notificar por escrito o LOCADOR com antecedência mínima de 30 (trinta) dias. De igual modo, aplicam-se regramentos vigentes para a retomada do imóvel.`
    });

    // Rent
    const indexExplanation = options.readjustmentIndex !== 'Sem Reajuste'
      ? `reajustado anualmente com base na variação positiva do índice ${options.readjustmentIndex}`
      : 'não sofrerá reajuste automático pelo decurso de tempo, mantendo-se o valor acordado nominal';

    sections.push({
      title: 'CLÁUSULA TERCEIRA - DO ALUGUEL, REAJUSTE E VENCIMENTO',
      content: `Como contraprestação pela locação, o LOCATÁRIO pagará mensalmente o valor de ${rentFormatted}, a ser pago impreterivelmente até o dia ${contract.dayOfPayment} de cada mês vincendo.\n\n` +
               `Parágrafo Primeiro: O aluguel mensal será pactuado e ${indexExplanation}.\n\n` +
               `Parágrafo Segundo: O pagamento deverá ser efetuado por transferência bancária, Pix (Chave: ${landlord.pixKey || landlord.email || 'conforme fornecida pelo locador'}), ou Boleto Bancário conforme emitido pelo sistema de cobrança.\n\n` +
               `Parágrafo Terceiro: O atraso no pagamento sujeitará o LOCATÁRIO a uma multa de mora de 10% (dez por cento) sobre o valor total do débito, acrescido de juros de 1% (um por cento) ao mês e correção monetária pro-rata die.`
    });

    // Taxes
    const iptuText = property.iptuAmount && property.iptuAmount > 0 
      ? `IPTU no valor aproximado de ${formatCurrency(property.iptuAmount)} mensais, ` 
      : '';
    const condoText = property.condoAmount && property.condoAmount > 0 
      ? `Taxa condominial no valor aproximado de ${formatCurrency(property.condoAmount)} mensais, ` 
      : '';

    sections.push({
      title: 'CLÁUSULA QUARTA - DOS ENCARGOS E TRIBUTOS',
      content: `Além do aluguel, correrão por exclusiva conta do LOCATÁRIO todas as despesas decorrentes do consumo de energia elétrica, água, esgoto, internet, além de tarifas públicas incidentes sobre o uso do imóvel.\n\n` +
               `Parágrafo Único: O LOCATÁRIO obriga-se também ao reembolso/pagamento de ${iptuText}${condoText} taxas de coleta de lixo e despesas ordinárias do condomínio, se houver, efetuando o pagamento nas datas cabíveis.`
    });

    // Maintenance
    sections.push({
      title: 'CLÁUSULA QUINTA - DA CONSERVAÇÃO E BENFEITORIAS',
      content: `O LOCATÁRIO declara receber o imóvel nas condições descritas no Termo de Vistoria, limpo e em perfeito estado de conservação de portas, janelas, fechaduras, fiação elétrica, instalações hidráulicas e pinturas, obrigando-se a devolvê-lo nas mesmas condições.\n\n` +
               `Parágrafo Único: Qualquer benfeitoria útil ou essencial ou alteração estrutural no imóvel somente poderá ser feita sob autorização expressa em documento firmado com o LOCADOR, sendo vedado o direito a retenção ou restituição.`
    });

    // Warranty
    let warrantyContent = '';
    if (options.warrantyType === 'deposit') {
      warrantyContent = `Em garantia das obrigações assumidas neste instrumento, o LOCATÁRIO presta garantia na modalidade de CAUÇÃO, consistente no depósito do montante pecuniário de ${options.warrantyValue || '3 (três) vezes o valor de um aluguel mensal'}. Esse valor será integralmente restituído ao fim da locação, devidamente corrigido, caso não existam débitos pendentes de aluguel ou danos ao imóvel constatados na vistoria final das dependências.`;
    } else if (options.warrantyType === 'guarantor') {
      warrantyContent = `O LOCATÁRIO apresenta como GARANTIA a vinculação de FIADOR idôneo, qualificado como: "${options.warrantyValue || 'Qualificação do Fiador com CPF/CNPJ e bens oferecidos'}" que assina solidariamente e conjuntamente este instrumento legal, responsabilizando-se subsidiariamente e solidariamente por todos os débitos locatícios, juros, pinturas, penalidades contratuais e demais obrigações inerentes.` ;
    } else {
      warrantyContent = `A presente locação é pactuada sem garantia locatícia, operando sob integral responsabilidade de crédito fiduciário direto do LOCATÁRIO, gozando do privilégio de desocupação imediata nos termos permitidos pela legislação civil de regência.`;
    }

    sections.push({
      title: 'CLÁUSULA SEXTA - DA GARANTIA LOCATÍCIA',
      content: warrantyContent
    });

    // Penal Fine
    sections.push({
      title: 'CLÁUSULA SÉTIMA - DA RESCISÃO E MULTA PENAL',
      content: `A infração de qualquer das cláusulas do presente contrato ensejará a sua rescisão imediata, de pleno direito, independentemente de interpelação judicial.\n\n` +
               `Parágrafo Único: A parte que der causa à rescisão antecipada ou inadimplemento incurso sujeitar-se-á à multa contratual de 3 (três) vezes o valor do aluguel vigente à época da infração, a ser recolhida de forma proporcional ao tempo restante de cumprimento do termo locativo sob o texto das leis federais.`
    });

    // Custom clauses if any
    if (options.customClauses && options.customClauses.trim().length > 0) {
      sections.push({
        title: 'CLÁUSULA OITAVA - DAS DISPOSIÇÕES ESPECIAIS',
        content: options.customClauses.trim()
      });
    }

    // Forum
    sections.push({
      title: 'CLÁUSULA NONA - DO FORO',
      content: `Para dirimir eventuais divergências legais oriundas da execução contratual estabelecida, elegem as partes contratantes, em comum acordo e em caráter de irrevogabilidade, o Foro da Comarca de domicílio do imóvel locado, renunciando expressamente a qualquer outro mais privilegiado que detenham.`
    });

    return { title, sections };
  },

  generatePDF(
    contract: Contract,
    property: Property,
    tenant: Tenant,
    landlord: Landlord,
    options: ContractGenerationOptions
  ): jsPDF {
    const { title, sections } = this.getTemplateText(contract, property, tenant, landlord, options);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageCountRef = { count: 1 };
    
    // Page margins and sizing constants
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = 25;

    // Header generator Helper
    const drawHeaderFooter = (activeDoc: jsPDF, pageNum: number) => {
      // Top header rule
      activeDoc.setDrawColor(226, 232, 240); // slate-200
      activeDoc.setLineWidth(0.3);
      activeDoc.line(margin, 12, pageWidth - margin, 12);
      
      activeDoc.setFont('helvetica', 'normal');
      activeDoc.setFontSize(8);
      activeDoc.setTextColor(100, 116, 139); // slate-500
      activeDoc.text('PORTAL ALUGA FÁCIL — SISTEMA JURÍDICO INTELIGENTE', margin, 10);
      
      // Footer page numbering
      activeDoc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      activeDoc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      activeDoc.text(`Locação: Ref. Acordo #${contract.id.substring(0, 8).toUpperCase()}`, margin, pageHeight - 10);
    };

    // Prepare title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 4;
    doc.setDrawColor(99, 102, 241); // indigo-500
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 25, currentY, pageWidth / 2 + 25, currentY);
    
    currentY += 12;

    // First page header init
    drawHeaderFooter(doc, 1);

    // Render Sections
    for (const section of sections) {
      // Check if we need a new page for the heading
      if (currentY + 15 > pageHeight - 20) {
        doc.addPage();
        pageCountRef.count++;
        drawHeaderFooter(doc, pageCountRef.count);
        currentY = 22;
      }

      // Render Section Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(section.title, margin, currentY);
      currentY += 6;

      // Split body text relative to content width
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // slate-600
      
      const paragraphs = section.content.split('\n\n');
      for (const paragraph of paragraphs) {
        const textLines = doc.splitTextToSize(paragraph, contentWidth);
        const textHeight = textLines.length * 5; // roughly 5mm per line spacing

        // Flow check for page transition
        if (currentY + textHeight > pageHeight - 22) {
          doc.addPage();
          pageCountRef.count++;
          drawHeaderFooter(doc, pageCountRef.count);
          currentY = 22;
          
          // Re-set font configuration on new page context
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
        }

        // Output lines with custom layout tracking
        textLines.forEach((line: string) => {
          doc.text(line, margin, currentY);
          currentY += 5;
        });
        
        currentY += 2.5; // margin gap between sub-paragraphs
      }
      
      currentY += 6; // gap after full clause block
    }

    // Signature Area
    const signatureHeight = 45;
    if (currentY + signatureHeight > pageHeight - 20) {
      doc.addPage();
      pageCountRef.count++;
      drawHeaderFooter(doc, pageCountRef.count);
      currentY = 22;
    }

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const placeDateText = `E, por estarem assim justas e contratadas, as partes assinam o presente instrumento físico ou digital em duas vias de igual teor e forma, para um só efeito de direito, na presença das testemunhas sob-qualificadas.`;
    const wrapPlaceText = doc.splitTextToSize(placeDateText, contentWidth);
    wrapPlaceText.forEach((l: string) => {
      doc.text(l, margin, currentY);
      currentY += 5;
    });

    currentY += 15;

    // Render signature layout lines
    const colWidth = contentWidth / 2;
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.3);

    // Overlay drawn signatures if present
    if (contract.signatures?.landlordSignature) {
      try {
        doc.addImage(contract.signatures.landlordSignature, 'PNG', margin + 5, currentY - 14, colWidth - 15, 13);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(16, 185, 129); // emerald-550
        doc.text('ASSINADO ELETRONICAMENTE', margin + (colWidth - 5) / 2, currentY - 1, { align: 'center' });
      } catch (err) {
        console.error('Error rendering landlord signature in PDF:', err);
      }
    }

    if (contract.signatures?.tenantSignature) {
      try {
        doc.addImage(contract.signatures.tenantSignature, 'PNG', margin + colWidth + 10, currentY - 14, colWidth - 15, 13);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(16, 185, 129); // emerald-550
        doc.text('ASSINADO ELETRONICAMENTE', margin + colWidth + 5 + (colWidth - 5) / 2, currentY - 1, { align: 'center' });
      } catch (err) {
        console.error('Error rendering tenant signature in PDF:', err);
      }
    }

    // Row 1 signature
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(148, 163, 184);
    doc.line(margin, currentY, margin + colWidth - 5, currentY);
    doc.line(margin + colWidth + 5, currentY, pageWidth - margin, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('LOCADOR', margin + (colWidth - 5) / 2, currentY, { align: 'center' });
    doc.text('LOCATÁRIO', margin + colWidth + 5 + (colWidth - 5) / 2, currentY, { align: 'center' });

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(landlord.name, margin + (colWidth - 5) / 2, currentY, { align: 'center' });
    doc.text(tenant.name, margin + colWidth + 5 + (colWidth - 5) / 2, currentY, { align: 'center' });

    currentY += 12;

    // Overlay drawn broker/witness signatures if present
    if (contract.signatures?.brokerSignature) {
      try {
        doc.addImage(contract.signatures.brokerSignature, 'PNG', margin + 5, currentY - 14, colWidth - 15, 13);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(16, 185, 129); // emerald-550
        doc.text('ASSINADO ELETRONICAMENTE', margin + (colWidth - 5) / 2, currentY - 1, { align: 'center' });
      } catch (err) {
        console.error('Error rendering broker signature in PDF:', err);
      }
    }

    // Row 2 witnesses signature line
    doc.line(margin, currentY, margin + colWidth - 5, currentY);
    doc.line(margin + colWidth + 5, currentY, pageWidth - margin, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('TESTEMUNHA 1', margin + (colWidth - 5) / 2, currentY, { align: 'center' });
    doc.text('TESTEMUNHA 2', margin + colWidth + 5 + (colWidth - 5) / 2, currentY, { align: 'center' });

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(contract.signatures?.brokerName || contract.testemunha1 || 'Testemunha 1', margin + (colWidth - 5) / 2, currentY, { align: 'center' });
    doc.text('Assinatura Manual', margin + colWidth + 5 + (colWidth - 5) / 2, currentY, { align: 'center' });

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(contract.identidade1 ? `Doc: ${contract.identidade1}` : 'CPF/RG:', margin + (colWidth - 5) / 2, currentY, { align: 'center' });
    doc.text('Nome/CPF:', margin + colWidth + 5 + (colWidth - 5) / 2, currentY, { align: 'center' });

    // Append Dedicated Electronic Signature Audit Trail Page at the end
    if (contract.signatures && (contract.signatures.landlordSignature || contract.signatures.tenantSignature || contract.signatures.brokerSignature)) {
      doc.addPage();
      pageCountRef.count++;
      drawHeaderFooter(doc, pageCountRef.count);
      
      let auditY = 25;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('CERTIFICADO DE ASSINATURA ELETRÔNICA', pageWidth / 2, auditY, { align: 'center' });
      
      auditY += 4;
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 35, auditY, pageWidth / 2 + 35, auditY);
      
      auditY += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const certIntro = 'Este documento foi assinado eletronicamente através do Portal Aluga Fácil com rastreabilidade digital completa. Abaixo constam os dados das assinaturas e a trilha de auditoria para fins de validade jurídica, em conformidade com a Medida Provisória nº 2.200-2 de 24/08/2001 e a Lei Federal nº 14.063/2020.';
      const wrapIntro = doc.splitTextToSize(certIntro, contentWidth);
      wrapIntro.forEach((l: string) => {
        doc.text(l, margin, auditY);
        auditY += 4.5;
      });
      
      auditY += 8;
      
      const renderAuditBox = (titleS: string, nameS: string, emailS: string, dateS: string, ipS: string, hashS: string, signatureS: string | undefined) => {
        if (auditY + 45 > pageHeight - 20) {
          doc.addPage();
          pageCountRef.count++;
          drawHeaderFooter(doc, pageCountRef.count);
          auditY = 25;
        }
        
        // Draw card background
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(margin, auditY, contentWidth, 38, 4, 4, 'FD');
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`REGISTRO: ${titleS}`, margin + 5, auditY + 5);
        
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(`Nome: ${nameS}`, margin + 5, auditY + 11);
        doc.text(`E-mail: ${emailS}`, margin + 5, auditY + 16);
        doc.text(`Data/Hora: ${dateS ? new Date(dateS).toLocaleString('pt-BR') : '__/__/____'}`, margin + 5, auditY + 21);
        doc.text(`IP de Origem: ${ipS || 'Rastreado'}`, margin + 5, auditY + 26);
        
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.text(`Hash de Integridade: ${hashS || 'N/A'}`, margin + 5, auditY + 33);
        
        // Signature Thumbnail on the right
        if (signatureS) {
          try {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(pageWidth - margin - 47, auditY + 4, 42, 24, 2, 2, 'FD');
            doc.addImage(signatureS, 'PNG', pageWidth - margin - 45, auditY + 6, 38, 20);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text('Rubrica Eletrônica', pageWidth - margin - 26, auditY + 31, { align: 'center' });
          } catch (e) {
            console.error(e);
          }
        }
        
        auditY += 44;
      };
      
      if (contract.signatures.landlordSignature) {
        renderAuditBox(
          'LOCADOR (PROPRIETÁRIO)',
          contract.signatures.landlordName || landlord.name,
          contract.signatures.landlordEmail || landlord.email,
          contract.signatures.landlordSignedAt || '',
          contract.signatures.landlordIp || 'Localhost',
          contract.signatures.landlordAuditHash || '',
          contract.signatures.landlordSignature
        );
      }
      
      if (contract.signatures.tenantSignature) {
        renderAuditBox(
          'LOCATÁRIO (INQUILINO)',
          contract.signatures.tenantName || tenant.name,
          contract.signatures.tenantEmail || tenant.email,
          contract.signatures.tenantSignedAt || '',
          contract.signatures.tenantIp || 'Localhost',
          contract.signatures.tenantAuditHash || '',
          contract.signatures.tenantSignature
        );
      }
      
      if (contract.signatures.brokerSignature) {
        renderAuditBox(
          'TESTEMUNHA 1',
          contract.signatures.brokerName || contract.testemunha1 || 'Testemunha 1',
          contract.signatures.brokerEmail || '',
          contract.signatures.brokerSignedAt || '',
          contract.signatures.brokerIp || 'Localhost',
          contract.signatures.brokerAuditHash || '',
          contract.signatures.brokerSignature
        );
      }
    }

    // Dynamic retrospective drawing of page numbers in total
    const pageTotal = pageCountRef.count;
    for (let i = 1; i <= pageTotal; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      // We overwrite or write total pages nicely
      doc.text(`de ${pageTotal}`, pageWidth - margin + 2, pageHeight - 10, { align: 'left' });
    }

    return doc;
  }
};

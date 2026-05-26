const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { round2 } = require('./sales.fiscal');

const formatCurrency = (num) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(round2(num || 0)).replace('ARS', '$');
};

const loadBannerBuffer = (bannerPath) => {
  if (!bannerPath) return null;
  if (bannerPath.startsWith('data:')) {
    return Buffer.from(bannerPath.split(',')[1], 'base64');
  }

  const absolute = path.join(__dirname, '../../../public', bannerPath);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute) : null;
};

const drawInvoicePdf = (doc, sale, config) => {
  let currentY = 50;
  const bannerBuffer = loadBannerBuffer(config.pdf_banner_path);

  if (bannerBuffer) {
    try {
      doc.image(bannerBuffer, 50, currentY, { width: 500, height: 90 });
      currentY += 105;
    } catch (error) {
      currentY += 10;
    }
  }

  const invoiceLabel = sale.billing?.invoice_type === 'A' ? 'FACTURA A' : 'FACTURA B';
  const invoiceNumber = `${String(sale.billing?.punto_venta || 0).padStart(4, '0')}-${String(sale.billing?.comprobante_nro || 0).padStart(8, '0')}`;
  const emitterName = config.arca_emitter_name || config.company_name || sale.branch_name || 'Chopper POS';
  const emitterCuit = config.arca_emitter_cuit || config.company_cuit || '-';
  const emitterAddress = config.arca_emitter_address || config.company_address || '-';
  const emitterIvaCondition = config.arca_emitter_iva_condition || '-';

  doc.fillColor('#111827').fontSize(22).font('Helvetica-Bold').text(invoiceLabel, 50, currentY);
  doc.fontSize(10).font('Helvetica').text(`Fecha: ${sale.billing?.fecha_emision || sale.created_at.slice(0, 10)}`, 50, currentY + 28);
  doc.text(`CAE: ${sale.billing?.cae || '-'}`, 50, currentY + 42);
  doc.text(`Vto. CAE: ${sale.billing?.cae_vto || '-'}`, 50, currentY + 56);

  doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f766e').text(invoiceNumber, 320, currentY, { align: 'right', width: 230 });
  doc.fontSize(10).font('Helvetica').fillColor('#111827').text(emitterName, 320, currentY + 28, { align: 'right', width: 230 });
  doc.text(`CUIT: ${emitterCuit}`, 320, currentY + 42, { align: 'right', width: 230 });
  doc.text(emitterAddress, 320, currentY + 56, { align: 'right', width: 230 });
  doc.text(emitterIvaCondition, 320, currentY + 70, { align: 'right', width: 230 });

  currentY += 105;
  doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor('#d1d5db').stroke();
  currentY += 18;

  const receiverName = sale.billing?.receiver_business_name || sale.billing?.receiver_name || sale.customer_name || 'Consumidor Final';
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Receptor', 50, currentY);
  doc.fontSize(10).font('Helvetica').text(receiverName, 50, currentY + 16);
  doc.text(`CUIT: ${sale.billing?.receiver_cuit || '-'}`, 50, currentY + 30);
  doc.text(`IVA: ${sale.billing?.receiver_iva_condition || '-'}`, 50, currentY + 44);
  doc.text(`Domicilio: ${sale.billing?.receiver_fiscal_address || '-'}`, 50, currentY + 58, { width: 300 });

  doc.fontSize(10).font('Helvetica').text(`Vendedor: ${sale.user_name}`, 350, currentY + 16, { width: 200, align: 'right' });
  doc.text(`Pago: ${(sale.payment_method || '').replace('_', ' ')}`, 350, currentY + 30, { width: 200, align: 'right' });
  doc.text(`Venta: ${sale.id.substring(0, 8).toUpperCase()}`, 350, currentY + 44, { width: 200, align: 'right' });

  currentY += 95;

  doc.rect(50, currentY, 500, 22).fill('#0f766e');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Descripcion', 60, currentY + 7);
  doc.text('Cant.', 285, currentY + 7, { width: 55, align: 'center' });
  doc.text('P. Final', 345, currentY + 7, { width: 75, align: 'center' });
  doc.text('Neto', 425, currentY + 7, { width: 55, align: 'center' });
  doc.text('Subtotal', 485, currentY + 7, { width: 55, align: 'right' });

  let rowY = currentY + 22;
  sale.items.forEach((item, index) => {
    if (index % 2 !== 0) {
      doc.rect(50, rowY, 500, 24).fill('#f8fafc');
    }
    doc.fillColor('#111827').font('Helvetica').fontSize(9);
    doc.text(item.product_name, 60, rowY + 7, { width: 215, ellipsis: true });
    doc.text(String(item.quantity), 285, rowY + 7, { width: 55, align: 'center' });
    doc.text(formatCurrency(item.unit_price_applied), 345, rowY + 7, { width: 75, align: 'center' });
    doc.text(formatCurrency(item.billing_net_unit_price || item.unit_price_applied), 425, rowY + 7, { width: 55, align: 'center' });
    doc.text(formatCurrency(item.subtotal), 485, rowY + 7, { width: 55, align: 'right' });
    rowY += 24;
  });

  rowY += 12;
  const totals = [
    ['Neto', sale.billing?.approved_net_amount || 0],
    ['IVA 21%', sale.billing?.approved_vat_amount || 0],
    ['Total', sale.billing?.approved_total_amount || sale.total],
  ];

  totals.forEach((entry, index) => {
    const y = rowY + index * 22;
    if (entry[0] === 'Total') {
      doc.rect(360, y - 4, 190, 22).fill('#0f766e');
      doc.fillColor('#ffffff').font('Helvetica-Bold');
    } else {
      doc.fillColor('#111827').font('Helvetica');
    }
    doc.text(entry[0], 380, y, { width: 60, align: 'left' });
    doc.text(formatCurrency(entry[1]), 440, y, { width: 95, align: 'right' });
  });

  const footerY = 740;
  doc.moveTo(50, footerY - 10).lineTo(550, footerY - 10).strokeColor('#d1d5db').stroke();
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text(emitterName, 50, footerY, { align: 'center', width: 500 });
  if (config.pdf_footer_message) {
    doc.fontSize(8).font('Helvetica').fillColor('#4b5563').text(config.pdf_footer_message, 50, footerY + 14, { align: 'center', width: 500 });
  }
};

const generateInvoicePdfBuffer = (sale, config) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawInvoicePdf(doc, sale, config);
    doc.end();
  });
};

module.exports = { generateInvoicePdfBuffer };

const PDFDocument = require('pdfkit');

const COPIES = ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO'];
const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 42.52,
};

const formatAmount = (value) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('es-AR').format(date);
};

const safeText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const unitLabel = (value) => {
  if (!value) return '-';
  const normalized = String(value).toLowerCase();
  if (normalized.includes('litro')) return 'Lt';
  if (normalized.includes('kilo')) return 'Kg';
  if (normalized.includes('unidad')) return 'Un';
  return String(value).slice(0, 8);
};

const invoiceMeta = (sale) => {
  const type = sale.billing?.invoice_type === 'A'
    ? { letter: 'A', code: '001', name: 'FACTURA A' }
    : { letter: 'B', code: '006', name: 'FACTURA B' };

  return {
    ...type,
    pointOfSale: String(sale.billing?.punto_venta || 0).padStart(5, '0'),
    number: String(sale.billing?.comprobante_nro || 0).padStart(8, '0'),
    emissionDate: formatDate(sale.billing?.fecha_emision || sale.created_at),
    periodFrom: formatDate(sale.billing?.periodo_desde || sale.billing?.fecha_emision || sale.created_at),
    periodTo: formatDate(sale.billing?.periodo_hasta || sale.billing?.fecha_emision || sale.created_at),
    paymentDueDate: formatDate(sale.billing?.fecha_emision || sale.created_at),
    condition: safeText(sale.billing?.condicion_venta || sale.payment_method?.replace('_', ' '), 'Contado'),
    cae: safeText(sale.billing?.cae),
    caeDue: formatDate(sale.billing?.cae_vto),
  };
};

const emitterMeta = (sale, config) => ({
  razonSocial: safeText(config.arca_emitter_name || config.company_name || sale.branch_name || 'Chopper POS'),
  domicilio: safeText(config.arca_emitter_address || config.company_address),
  condicionIva: safeText(config.arca_emitter_iva_condition),
  cuit: safeText(config.arca_emitter_cuit || config.company_cuit),
  iibb: safeText(config.arca_emitter_iibb),
  fechaInicio: formatDate(config.arca_emitter_activity_start_date),
});

const receiverMeta = (sale) => ({
  cuit: safeText(sale.billing?.receiver_cuit),
  nombre: safeText(sale.billing?.receiver_business_name || sale.billing?.receiver_name || sale.customer_name || 'Consumidor Final'),
  condicionIva: safeText(sale.billing?.receiver_iva_condition || sale.customer_iva_condition || 'Consumidor Final'),
  domicilio: safeText(sale.billing?.receiver_fiscal_address || sale.customer_fiscal_address),
});

const buildItems = (sale) => {
  return sale.items.map((item) => ({
    codigo: item.product_id ? item.product_id.slice(0, 6).toUpperCase() : 'MANUAL',
    descripcion: safeText(item.product_name),
    cantidad: formatAmount(item.quantity),
    unidad: unitLabel(item.unidad_display || item.unit_type),
    precioUnit: formatAmount(item.billing_net_unit_price || item.unit_price_applied),
    bonifPct: '0,00',
    subtotal: formatAmount(item.billing_net_unit_price ? item.billing_net_unit_price * Number(item.quantity) : item.subtotal),
    alicuotaIva: '21,00%',
    subtotalConIva: formatAmount(item.subtotal),
  }));
};

const buildTotals = (sale) => {
  const neto = Number(sale.billing?.approved_net_amount || sale.fiscal_summary?.net_amount || 0);
  const iva = Number(sale.billing?.approved_vat_amount || sale.fiscal_summary?.vat_amount || 0);
  const total = Number(sale.billing?.approved_total_amount || sale.total || 0);

  return {
    netoGravado: formatAmount(neto),
    iva27: '0,00',
    iva21: formatAmount(iva),
    iva105: '0,00',
    iva5: '0,00',
    iva25: '0,00',
    iva0: '0,00',
    otrosTributos: '0,00',
    total: formatAmount(total),
  };
};

const drawText = (doc, text, x, y, options = {}) => {
  doc.font(options.font || 'Helvetica')
    .fontSize(options.size || 9)
    .fillColor(options.color || '#000000')
    .text(String(text), x, y, {
      width: options.width,
      align: options.align || 'left',
      lineGap: options.lineGap || 0,
    });
};

const drawLabeledValue = (doc, label, value, x, y, options = {}) => {
  const labelWidth = options.labelWidth || 130;
  drawText(doc, label, x, y, { font: 'Helvetica-Bold', size: options.size || 9, width: labelWidth });
  drawText(doc, value, x + labelWidth, y, { size: options.size || 9, width: options.valueWidth || 200 });
};

const drawCopyLabel = (doc, copyName) => {
  const x = PAGE.margin;
  const y = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const height = 24;
  doc.rect(x, y, width, height).stroke('#000000');
  drawText(doc, copyName, x, y + 6, { font: 'Helvetica-Bold', size: 12, width, align: 'center' });
  return y + height;
};

const drawHeader = (doc, sale, config, topY) => {
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const leftWidth = width / 2;
  const rightWidth = width / 2;
  const height = 118;
  const midX = x + leftWidth;
  const emitter = emitterMeta(sale, config);
  const invoice = invoiceMeta(sale);

  doc.rect(x, topY, width, height).stroke('#000000');
  doc.moveTo(midX, topY).lineTo(midX, topY + height).stroke('#000000');

  const cBoxWidth = 55;
  const cBoxHeight = 55;
  const cBoxX = x + width / 2 - cBoxWidth / 2;
  doc.rect(cBoxX, topY, cBoxWidth, cBoxHeight).fillAndStroke('#FFFFFF', '#000000');
  drawText(doc, invoice.letter, cBoxX, topY + 5, { font: 'Helvetica-Bold', size: 30, width: cBoxWidth, align: 'center' });
  drawText(doc, `COD. ${invoice.code}`, cBoxX, topY + 40, { size: 7, width: cBoxWidth, align: 'center' });

  drawText(doc, emitter.razonSocial, x + 10, topY + 10, { font: 'Helvetica-Bold', size: 16, width: leftWidth - 20, align: 'center' });
  drawLabeledValue(doc, 'Razón Social:', emitter.razonSocial, x + 10, topY + 38, { labelWidth: 82, valueWidth: leftWidth - 100 });
  drawLabeledValue(doc, 'Domicilio Comercial:', emitter.domicilio, x + 10, topY + 54, { labelWidth: 110, valueWidth: leftWidth - 126 });
  drawLabeledValue(doc, 'Condición frente al IVA:', emitter.condicionIva, x + 10, topY + 70, { labelWidth: 126, valueWidth: leftWidth - 142 });

  const rightX = midX + 50;
  drawText(doc, invoice.name, rightX, topY + 8, { font: 'Helvetica-Bold', size: 22, width: rightWidth - 60 });
  drawText(doc, `Punto de Venta: ${invoice.pointOfSale}`, rightX, topY + 38, { font: 'Helvetica-Bold', size: 9, width: 110 });
  drawText(doc, `Comp. Nro: ${invoice.number}`, rightX + 122, topY + 38, { font: 'Helvetica-Bold', size: 9, width: 120 });
  drawLabeledValue(doc, 'Fecha de Emisión:', invoice.emissionDate, rightX, topY + 54, { labelWidth: 90, valueWidth: 100 });
  drawLabeledValue(doc, 'CUIT:', emitter.cuit, rightX, topY + 70, { labelWidth: 34, valueWidth: 100 });
  drawLabeledValue(doc, 'Ingresos Brutos:', emitter.iibb, rightX, topY + 86, { labelWidth: 86, valueWidth: 100 });
  drawLabeledValue(doc, 'Fecha de Inicio de Actividades:', emitter.fechaInicio, rightX, topY + 102, { labelWidth: 145, valueWidth: 100 });

  return topY + height;
};

const drawPeriodRow = (doc, sale, startY) => {
  const invoice = invoiceMeta(sale);
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const height = 24;
  doc.rect(x, startY, width, height).stroke('#000000');
  drawText(doc, `Período Facturado Desde:  ${invoice.periodFrom}`, x + 10, startY + 7, { font: 'Helvetica-Bold', size: 8.5, width: 195 });
  drawText(doc, `Hasta:  ${invoice.periodTo}`, x + 208, startY + 7, { font: 'Helvetica-Bold', size: 8.5, width: 120 });
  drawText(doc, `Fecha de Vto. para el pago: ${invoice.paymentDueDate}`, x + 330, startY + 7, { font: 'Helvetica-Bold', size: 8.5, width: 180, align: 'right' });
  return startY + height;
};

const drawClientRow = (doc, sale, startY) => {
  const client = receiverMeta(sale);
  const invoice = invoiceMeta(sale);
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const height = 56;
  doc.rect(x, startY, width, height).stroke('#000000');

  drawLabeledValue(doc, 'CUIT:', client.cuit, x + 10, startY + 7, { labelWidth: 30, valueWidth: 140 });
  drawLabeledValue(doc, 'Apellido y Nombre / Razón Social:', client.nombre, x + 180, startY + 7, { labelWidth: 160, valueWidth: 170 });
  drawLabeledValue(doc, 'Condición frente al IVA:', client.condicionIva, x + 10, startY + 23, { labelWidth: 118, valueWidth: 120 });
  drawLabeledValue(doc, 'Domicilio Comercial:', client.domicilio, x + 245, startY + 23, { labelWidth: 105, valueWidth: 160 });
  drawLabeledValue(doc, 'Condición de venta:', invoice.condition, x + 10, startY + 39, { labelWidth: 92, valueWidth: 200 });

  return startY + height;
};

const drawItemsTable = (doc, sale, startY) => {
  const x = PAGE.margin;
  const tableWidth = PAGE.width - PAGE.margin * 2;
  const headerHeight = 24;
  const rowHeight = 21;
  const spacerHeight = 200;
  const columns = [
    { key: 'codigo', label: 'Código', width: 31 },
    { key: 'descripcion', label: 'Producto / Servicio', width: 121 },
    { key: 'cantidad', label: 'Cantidad', width: 35, align: 'right' },
    { key: 'unidad', label: 'U. medida', width: 40, align: 'center' },
    { key: 'precioUnit', label: 'Precio Unit.', width: 56, align: 'right' },
    { key: 'bonifPct', label: '% Bonif', width: 35, align: 'right' },
    { key: 'subtotal', label: 'Subtotal', width: 56, align: 'right' },
    { key: 'alicuotaIva', label: 'Alicuota IVA', width: 45, align: 'center' },
    { key: 'subtotalConIva', label: 'Subtotal c/IVA', width: 61, align: 'right' },
  ];
  const items = buildItems(sale);

  doc.rect(x, startY, tableWidth, headerHeight).fillAndStroke('#C0C0C0', '#000000');

  let cursorX = x;
  columns.forEach((column, index) => {
    if (index > 0) {
      doc.moveTo(cursorX, startY).lineTo(cursorX, startY + headerHeight).stroke('#000000');
    }
    drawText(doc, column.label, cursorX + 2, startY + 7, {
      font: 'Helvetica-Bold',
      size: 7.5,
      width: column.width - 4,
      align: 'center',
    });
    cursorX += column.width;
  });
  doc.rect(x, startY, tableWidth, headerHeight).stroke('#000000');

  let rowY = startY + headerHeight;
  items.forEach((item) => {
    let colX = x;
    doc.rect(x, rowY, tableWidth, rowHeight).stroke('#C0C0C0');
    columns.forEach((column) => {
      doc.moveTo(colX, rowY).lineTo(colX, rowY + rowHeight).stroke('#C0C0C0');
      drawText(doc, item[column.key], colX + 2, rowY + 6, {
        size: 8,
        width: column.width - 4,
        align: column.align || 'left',
      });
      colX += column.width;
    });
    doc.moveTo(x + tableWidth, rowY).lineTo(x + tableWidth, rowY + rowHeight).stroke('#C0C0C0');
    rowY += rowHeight;
  });

  doc.rect(x, rowY, tableWidth, spacerHeight).stroke('#000000');
  return rowY + spacerHeight;
};

const drawTotals = (doc, sale, startY) => {
  const totals = buildTotals(sale);
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const height = 118;
  doc.lineWidth(2).rect(x, startY, width, height).stroke('#000000');
  doc.lineWidth(1);

  const splitX = x + width / 2;
  doc.moveTo(splitX, startY).lineTo(splitX, startY + height).stroke('#CCCCCC');

  drawText(doc, 'Importe Otros Tributos: $', x + 120, startY + 12, { size: 9, width: 120, align: 'right' });
  drawText(doc, totals.otrosTributos, x + 245, startY + 12, { size: 9, width: 40, align: 'right' });

  const rightX = splitX + 10;
  const lines = [
    ['Importe Neto Gravado: $', totals.netoGravado, true],
    ['IVA 27%: $', totals.iva27],
    ['IVA 21%: $', totals.iva21],
    ['IVA 10,5%: $', totals.iva105],
    ['IVA 5%: $', totals.iva5],
    ['IVA 2,5%: $', totals.iva25],
    ['IVA 0%: $', totals.iva0],
    ['Importe Otros Tributos: $', totals.otrosTributos],
    ['Importe Total: $', totals.total, true],
  ];

  lines.forEach((line, index) => {
    const y = startY + 10 + index * 11.5;
    drawText(doc, line[0], rightX + 60, y, { font: line[2] ? 'Helvetica-Bold' : 'Helvetica', size: line[0].includes('Total') ? 10 : 9, width: 135, align: 'right' });
    drawText(doc, line[1], rightX + 200, y, { font: line[2] ? 'Helvetica-Bold' : 'Helvetica', size: line[0].includes('Total') ? 10 : 9, width: 55, align: 'right' });
  });

  return startY + height;
};

const drawQrPlaceholder = (doc, x, y) => {
  const size = 76;
  doc.rect(x, y, size, size).stroke('#000000');
  for (let i = 0; i < 8; i += 1) {
    doc.moveTo(x, y + i * 9.5).lineTo(x + size, y + i * 9.5).stroke('#DDDDDD');
    doc.moveTo(x + i * 9.5, y).lineTo(x + i * 9.5, y + size).stroke('#DDDDDD');
  }
  drawText(doc, 'QR', x, y + 27, { font: 'Helvetica-Bold', size: 18, width: size, align: 'center' });
};

const drawFooter = (doc, sale, startY) => {
  const invoice = invoiceMeta(sale);
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;

  drawQrPlaceholder(doc, x, startY);
  drawText(doc, 'ARCA', x + 84, startY + 28, { font: 'Helvetica-Bold', size: 20, color: '#003366', width: 90 });
  drawText(doc, 'AGENCIA DE RECAUDACIÓN\nY CONTROL ADUANERO', x + 84, startY + 50, {
    size: 5.5,
    color: '#003366',
    width: 95,
    lineGap: 0,
  });
  drawText(doc, 'Comprobante Autorizado', x, startY + 90, { font: 'Helvetica-Bold', size: 9, width: 175 });
  drawText(doc, 'Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación', x, startY + 104, { size: 7, width: 190 });

  drawText(doc, 'Pág. 1/1', x + 220, startY + 50, { font: 'Helvetica-Bold', size: 9, width: 70, align: 'center' });

  drawLabeledValue(doc, 'CAE N°:', invoice.cae, x + 330, startY + 8, { labelWidth: 48, valueWidth: 130, size: 9 });
  drawLabeledValue(doc, 'Fecha de Vto. de CAE:', invoice.caeDue, x + 330, startY + 24, { labelWidth: 105, valueWidth: 85, size: 9 });
};

const drawInvoicePdf = (doc, sale, config, copyName) => {
  let cursorY = drawCopyLabel(doc, copyName);
  cursorY = drawHeader(doc, sale, config, cursorY);
  cursorY = drawPeriodRow(doc, sale, cursorY);
  cursorY = drawClientRow(doc, sale, cursorY);
  cursorY = drawItemsTable(doc, sale, cursorY);
  cursorY = drawTotals(doc, sale, cursorY + 10);
  drawFooter(doc, sale, cursorY + 24);
};

const generateInvoicePdfBuffer = (sale, config) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE.margin,
      autoFirstPage: false,
    });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    COPIES.forEach((copyName, index) => {
      doc.addPage({ size: 'A4', margin: PAGE.margin });
      drawInvoicePdf(doc, sale, config, copyName);
      if (index < COPIES.length - 1) {
        doc.flushPages();
      }
    });

    doc.end();
  });
};

module.exports = { generateInvoicePdfBuffer };

const DEFAULT_IVA_RATE = 0.21;
const DEFAULT_IVA_ID = 5;

const INVOICE_TYPES = {
  A: { code: 'A', label: 'Factura A', tipoComprobante: 1 },
  B: { code: 'B', label: 'Factura B', tipoComprobante: 6 },
};

const IVA_CONDICION_DEFAULT_B = 'Consumidor Final';

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const sanitizeText = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeReceiver = (baseReceiver = {}, overrides = {}) => {
  const merged = {
    name: sanitizeText(overrides.name) || sanitizeText(baseReceiver.name),
    business_name: sanitizeText(overrides.business_name) || sanitizeText(baseReceiver.business_name),
    cuit: sanitizeText(overrides.cuit) || sanitizeText(baseReceiver.cuit),
    iva_condition: sanitizeText(overrides.iva_condition) || sanitizeText(baseReceiver.iva_condition),
    fiscal_address: sanitizeText(overrides.fiscal_address) || sanitizeText(baseReceiver.fiscal_address),
  };

  if (!merged.name && merged.business_name) {
    merged.name = merged.business_name;
  }

  if (!merged.business_name && merged.name) {
    merged.business_name = merged.name;
  }

  return merged;
};

const buildReceiverFromCustomer = (customer) => {
  if (!customer) return {};
  return {
    name: customer.name,
    business_name: customer.business_name,
    cuit: customer.cuit,
    iva_condition: customer.iva_condition,
    fiscal_address: customer.fiscal_address,
  };
};

const validateBillingDraft = ({ billing, receiver }) => {
  if (!billing || !billing.emit) return;

  if (!INVOICE_TYPES[billing.invoice_type]) {
    throw { status: 400, message: 'Tipo de factura inválido. Use Factura A o Factura B.' };
  }

  if (!receiver.name && !receiver.business_name) {
    throw { status: 400, message: 'Los datos del receptor son obligatorios para emitir factura.' };
  }

  if (billing.invoice_type === 'A') {
    if (!receiver.cuit || !receiver.iva_condition || !receiver.fiscal_address) {
      throw {
        status: 400,
        message: 'Factura A requiere CUIT, condición frente al IVA y domicilio fiscal del receptor.',
      };
    }
  }
};

const calculateIncludedVatBreakdown = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'No hay items para facturar.' };
  }

  const lines = items.map((item, index) => {
    const quantity = parseNumber(item.quantity ?? item.cantidad);
    const grossUnitPrice = round2(item.unit_price_applied ?? item.precio_unitario);
    const grossSubtotal = round2(item.subtotal ?? quantity * grossUnitPrice);
    const description = sanitizeText(item.product_name || item.custom_description || item.descripcion) || `Item ${index + 1}`;

    const netSubtotal = round2(grossSubtotal / (1 + DEFAULT_IVA_RATE));
    const vatSubtotal = round2(grossSubtotal - netSubtotal);
    const netUnitPrice = quantity > 0 ? round2(netSubtotal / quantity) : netSubtotal;

    return {
      description,
      quantity,
      grossUnitPrice,
      grossSubtotal,
      netSubtotal,
      vatSubtotal,
      netUnitPrice,
      alicuotaIvaId: DEFAULT_IVA_ID,
    };
  });

  const totals = lines.reduce(
    (acc, line) => {
      acc.gross += line.grossSubtotal;
      acc.net += line.netSubtotal;
      acc.vat += line.vatSubtotal;
      return acc;
    },
    { gross: 0, net: 0, vat: 0 }
  );

  totals.gross = round2(totals.gross);
  totals.net = round2(totals.net);
  totals.vat = round2(totals.vat);

  const delta = round2(totals.gross - (totals.net + totals.vat));
  if (delta !== 0 && lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    lastLine.vatSubtotal = round2(lastLine.vatSubtotal + delta);
    lastLine.netSubtotal = round2(lastLine.grossSubtotal - lastLine.vatSubtotal);
    lastLine.netUnitPrice = lastLine.quantity > 0 ? round2(lastLine.netSubtotal / lastLine.quantity) : lastLine.netSubtotal;
    totals.net = round2(lines.reduce((sum, line) => sum + line.netSubtotal, 0));
    totals.vat = round2(lines.reduce((sum, line) => sum + line.vatSubtotal, 0));
  }

  return {
    lines,
    netAmount: totals.net,
    vatAmount: totals.vat,
    totalAmount: totals.gross,
  };
};

const normalizeBillingRequest = (billing = {}, customer = null) => {
  const baseReceiver = buildReceiverFromCustomer(customer);
  const receiver = normalizeReceiver(baseReceiver, billing.receiver || {});
  const normalized = {
    emit: Boolean(billing.emit),
    invoice_type: sanitizeText(billing.invoice_type) || 'B',
    condicion_venta: sanitizeText(billing.condicion_venta) || null,
    receiver,
  };

  if (!normalized.receiver.iva_condition && normalized.invoice_type === 'B') {
    normalized.receiver.iva_condition = IVA_CONDICION_DEFAULT_B;
  }

  validateBillingDraft({ billing: normalized, receiver: normalized.receiver });
  return normalized;
};

const validateArcaAmounts = (expected, actual) => {
  const pairs = [
    ['monto_total', expected.totalAmount, actual.monto_total],
    ['imp_neto', expected.netAmount, actual.imp_neto],
    ['imp_iva', expected.vatAmount, actual.imp_iva],
  ];

  for (const [label, expectedValue, actualValue] of pairs) {
    if (round2(expectedValue) !== round2(actualValue)) {
      throw {
        status: 502,
        message: `ARCA devolvió ${label} inconsistente. Esperado ${round2(expectedValue)}, recibido ${round2(actualValue)}.`,
      };
    }
  }
};

module.exports = {
  DEFAULT_IVA_ID,
  DEFAULT_IVA_RATE,
  INVOICE_TYPES,
  IVA_CONDICION_DEFAULT_B,
  round2,
  sanitizeText,
  normalizeReceiver,
  buildReceiverFromCustomer,
  calculateIncludedVatBreakdown,
  normalizeBillingRequest,
  validateArcaAmounts,
};

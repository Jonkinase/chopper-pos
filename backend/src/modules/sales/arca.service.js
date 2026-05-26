const configService = require('../config/config.service');
const { round2, sanitizeText } = require('./sales.fiscal');

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const normalizeDate = (value) => {
  if (!value) return null;
  const stringValue = String(value);
  return stringValue.length >= 10 ? stringValue.slice(0, 10) : stringValue;
};

const normalizeNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return round2(parsed);
};

class ArcaService {
  async getRuntimeConfig() {
    const config = await configService.getAll();
    const runtime = {
      baseUrl: sanitizeText(config.arca_base_url),
      apiKey: sanitizeText(config.arca_api_key),
      env: sanitizeText(config.arca_env) || 'testing',
      puntoVenta: Number(config.arca_punto_venta || 0),
      condicionVentaDefault: sanitizeText(config.arca_condicion_venta_default) || 'Contado',
    };

    if (!runtime.baseUrl || !runtime.apiKey || !runtime.puntoVenta) {
      throw {
        status: 400,
        message: 'Configuración ARCA incompleta. Revise base URL, API key y punto de venta.',
      };
    }

    return runtime;
  }

  buildPayload({ runtime, billing, sale, fiscal }) {
    return {
      env: runtime.env,
      tipo_comprobante: billing.tipoComprobante,
      punto_venta: runtime.puntoVenta,
      concepto: 1,
      fecha_emision: billing.fechaEmision,
      condicion_venta: billing.condicionVenta,
      monto_total: fiscal.totalAmount,
      imp_neto: fiscal.netAmount,
      imp_iva: fiscal.vatAmount,
      receptor: {
        nombre: billing.receiver.name,
        razon_social: billing.receiver.business_name,
        cuit: billing.receiver.cuit,
        condicion_iva: billing.receiver.iva_condition,
        domicilio: billing.receiver.fiscal_address,
      },
      items: fiscal.lines.map((line) => ({
        descripcion: line.description,
        cantidad: line.quantity,
        precio_unitario: line.netUnitPrice,
        alicuota_iva_id: line.alicuotaIvaId,
      })),
      metadata: {
        sale_id: sale.id,
        sale_total: sale.total,
      },
    };
  }

  normalizeSuccessResponse(body = {}, runtime, expected) {
    const source = body.data || body.result || body.comprobante || body;
    const montoTotal = pickFirst(
      source.monto_total,
      source.total,
      source.imp_total,
      body.monto_total,
      body.total,
      expected.totalAmount
    );
    const impNeto = pickFirst(source.imp_neto, source.neto, body.imp_neto, expected.netAmount);
    const impIva = pickFirst(source.imp_iva, source.iva, body.imp_iva, expected.vatAmount);

    return {
      raw: body,
      cae: sanitizeText(pickFirst(source.cae, body.cae)),
      cae_vto: normalizeDate(pickFirst(source.cae_vto, source.vencimiento_cae, body.cae_vto)),
      comprobante_nro: pickFirst(source.comprobante_nro, source.cbte_nro, body.comprobante_nro),
      punto_venta: Number(pickFirst(source.punto_venta, source.pto_vta, body.punto_venta, runtime.puntoVenta) || runtime.puntoVenta),
      tipo_comprobante: Number(pickFirst(source.tipo_comprobante, source.cbte_tipo, body.tipo_comprobante)),
      fecha_emision: normalizeDate(pickFirst(source.fecha_emision, source.fecha, body.fecha_emision)),
      periodo_desde: normalizeDate(pickFirst(source.periodo_desde, body.periodo_desde)),
      periodo_hasta: normalizeDate(pickFirst(source.periodo_hasta, body.periodo_hasta)),
      monto_total: normalizeNumber(montoTotal),
      imp_neto: normalizeNumber(impNeto),
      imp_iva: normalizeNumber(impIva),
    };
  }

  async emitInvoice(payload, expected) {
    const runtime = await this.getRuntimeConfig();
    const url = `${runtime.baseUrl.replace(/\/$/, '')}/facturar`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': runtime.apiKey,
          Authorization: `Bearer ${runtime.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const rawText = await response.text();
      let body;
      try {
        body = rawText ? JSON.parse(rawText) : {};
      } catch (error) {
        body = { raw: rawText };
      }

      if (!response.ok) {
        const message = sanitizeText(body.message) || sanitizeText(body.error) || `ARCA respondió con estado ${response.status}`;
        return {
          ok: false,
          status: response.status === 422 ? 422 : 502,
          error: message,
          response: body,
          runtime,
        };
      }

      return {
        ok: true,
        status: response.status,
        data: this.normalizeSuccessResponse(body, runtime, expected),
        response: body,
        runtime,
      };
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'Timeout al emitir factura en ARCA.'
        : `No se pudo conectar con ARCA: ${error.message}`;

      return {
        ok: false,
        status: 502,
        error: message,
        response: { error: message },
        runtime,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = new ArcaService();

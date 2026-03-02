const quotesService = require('./quotes.service');
const PDFDocument = require('pdfkit');

class QuotesController {
  async getAll(req, res, next) {
    try {
      const filters = {
        sucursal_id: req.query.sucursal_id || req.user.branch_id,
        estado: req.query.estado
      };
      const data = await quotesService.getAll(filters);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await quotesService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const quoteData = req.body;
      if (req.user.role !== 'admin') {
        quoteData.sucursal_id = req.user.branch_id;
      }
      const data = await quotesService.create(quoteData, req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      await quotesService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Presupuesto actualizado' });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updatedQuote = await quotesService.updateStatus(req.params.id, status);
      res.json({ success: true, message: 'Estado actualizado', data: updatedQuote });
    } catch (err) {
      next(err);
    }
  }

  async convertToSale(req, res, next) {
    try {
      const { tipo_pago } = req.body;
      const data = await quotesService.convertToSale(req.params.id, req.user.user_id, tipo_pago);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await quotesService.delete(req.params.id);
      res.json({ success: true, message: 'Presupuesto eliminado' });
    } catch (err) {
      next(err);
    }
  }

  async generatePDF(req, res, next) {
    try {
      const quote = await quotesService.getById(req.params.id);
      
      const doc = new PDFDocument({ margin: 50 });
      let filename = `Presupuesto_${quote.id.substring(0, 8)}.pdf`;
      
      res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
      res.setHeader('Content-type', 'application/pdf');
      
      doc.pipe(res);

      // Header
      if (quote.logo_url) {
        // En una implementación real descargaríamos la imagen o usaríamos un path local
        // doc.image(quote.logo_url, 50, 45, { width: 50 });
      }
      
      doc.fillColor('#444444')
         .fontSize(20)
         .text(quote.name || 'Chopper POS', 110, 57)
         .fontSize(10)
         .text(quote.razon_social || '', 200, 65, { align: 'right' })
         .text(`CUIT: ${quote.cuit || ''}`, 200, 80, { align: 'right' })
         .text(quote.address || '', 200, 95, { align: 'right' })
         .moveDown();

      doc.hr = (y) => doc.moveTo(50, y).lineTo(550, y).stroke();
      doc.hr(125);

      // Customer Info
      doc.fontSize(12)
         .text(`Presupuesto Nº: ${quote.id.substring(0, 8)}`, 50, 140)
         .text(`Fecha: ${new Date(quote.created_at).toLocaleDateString()}`, 50, 155)
         .text(`Estado: ${quote.status.toUpperCase()}`, 50, 170)
         .text(`Cliente: ${quote.customer_name || 'Consumidor Final'}`, 300, 140)
         .moveDown();

      doc.hr(190);

      // Table Header
      let invoiceTableTop = 210;
      doc.fontSize(10)
         .text('Producto', 50, invoiceTableTop)
         .text('Cant.', 250, invoiceTableTop)
         .text('P. Unit', 330, invoiceTableTop)
         .text('Tipo', 400, invoiceTableTop)
         .text('Subtotal', 480, invoiceTableTop, { align: 'right' });

      doc.hr(225);

      // Table Items
      let i = 0;
      quote.items.forEach(item => {
        const y = invoiceTableTop + 30 + (i * 25);
        doc.text(item.product_name, 50, y)
           .text(`${item.quantity} ${item.unit_type || ''}`, 250, y)
           .text(`$${item.unit_price_applied}`, 330, y)
           .text(item.price_type, 400, y)
           .text(`$${item.subtotal}`, 480, y, { align: 'right' });
        i++;
      });

      const subtotalPosition = invoiceTableTop + 30 + (i * 25) + 30;
      doc.hr(subtotalPosition - 10);
      doc.fontSize(14)
         .text('TOTAL:', 380, subtotalPosition)
         .text(`$${quote.total}`, 480, subtotalPosition, { align: 'right' });

      // Footer
      doc.fontSize(10)
         .text('Este presupuesto tiene una validez de 7 días corridos.', 50, 700, { align: 'center', width: 500 });

      doc.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new QuotesController();

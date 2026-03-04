const quotesService = require('./quotes.service');
const configService = require('../config/config.service');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
      const config = await configService.getAll();
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let filename = `Presupuesto_${quote.id.substring(0, 8)}.pdf`;
      
      res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
      res.setHeader('Content-type', 'application/pdf');
      
      doc.pipe(res);

      const formatPrice = (num) => {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 2
        }).format(num).replace('ARS', '$');
      };

      let currentY = 50;

      // 1. Banner
      if (config.pdf_banner_path) {
        const bannerPath = path.join(__dirname, '../../../public', config.pdf_banner_path);
        if (fs.existsSync(bannerPath)) {
          doc.image(bannerPath, 50, currentY, { width: 500, height: 100 });
          currentY += 110;
        }
      }

      // 2. Header Info - Two Columns
      // LEFT COLUMN: Branch Info
      doc.fillColor('#444444');
      doc.fontSize(12).font('Helvetica-Bold').text(quote.branch_name || 'Sucursal', 50, currentY);
      doc.fontSize(9).font('Helvetica').text(quote.branch_address || '', 50, currentY + 15);
      // doc.text(quote.branch_phone || '', 50, currentY + 27); // Add if available in quote object

      // RIGHT COLUMN: Document Info
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#0d9488').text(`Presupuesto Nº: ${quote.id.substring(0, 8).toUpperCase()}`, 300, currentY, { align: 'right', width: 250 });
      doc.fontSize(10).font('Helvetica').fillColor('#444444').text(`Fecha: ${new Date(quote.created_at).toLocaleDateString()}`, 300, currentY + 18, { align: 'right', width: 250 });
      doc.fontSize(10).font('Helvetica-Bold').text(`Cliente: ${quote.customer_name || 'Consumidor Final'}`, 300, currentY + 30, { align: 'right', width: 250 });

      currentY += 70;
      doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor('#eeeeee').stroke();
      currentY += 20;

      // 3. Items Table
      const tableTop = currentY;
      doc.rect(50, tableTop, 500, 20).fill('#0d9488');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('Producto', 60, tableTop + 6);
      doc.text('Cantidad', 280, tableTop + 6, { width: 60, align: 'center' });
      doc.text('Precio Unit.', 350, tableTop + 6, { width: 70, align: 'center' });
      doc.text('Tipo', 425, tableTop + 6, { width: 40, align: 'center' });
      doc.text('Subtotal', 470, tableTop + 6, { width: 70, align: 'right' });

      let i = 0;
      doc.fillColor('#444444').font('Helvetica');
      quote.items.forEach(item => {
        const y = tableTop + 20 + (i * 25);
        
        // Zebra striping
        if (i % 2 !== 0) {
          doc.rect(50, y, 500, 25).fill('#f0fdfa');
          doc.fillColor('#444444');
        }

        // Unit logic
        let unitLabel = '';
        if (item.product_id) {
          if (item.product_type === 'liquido') unitLabel = '(litros)';
          else if (item.product_type === 'alimento') unitLabel = '(kg)';
          else unitLabel = '(unidades)';
        }

        // Price type logic
        const priceTypeLabel = item.price_type === 'mayoreo' ? 'Por mayor' : 'Por menor';

        doc.text(item.product_name, 60, y + 8, { width: 210, ellipsis: true });
        doc.text(`${item.quantity} ${unitLabel}`, 280, y + 8, { width: 60, align: 'center' });
        doc.text(formatPrice(item.unit_price_applied), 350, y + 8, { width: 70, align: 'center' });
        doc.text(priceTypeLabel, 425, y + 8, { width: 40, align: 'center' });
        doc.text(formatPrice(item.subtotal), 470, y + 8, { width: 70, align: 'right' });
        i++;
      });

      currentY = tableTop + 20 + (i * 25) + 20;

      // 4. Total
      doc.rect(350, currentY, 200, 30).fill('#0d9488');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('TOTAL:', 360, currentY + 10);
      doc.text(formatPrice(quote.total), 420, currentY + 10, { width: 120, align: 'right' });

      // 5. Footer (Company Data and Messages)
      const footerY = 740;
      doc.moveTo(50, footerY - 10).lineTo(550, footerY - 10).strokeColor('#dddddd').stroke();
      
      // Company Identity
      const companyLine = [
        config.company_name || 'Chopper POS',
        config.company_cuit ? `CUIT: ${config.company_cuit}` : null
      ].filter(Boolean).join(' | ');
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#444444').text(companyLine, 50, footerY, { align: 'center', width: 500 });
      
      // Footer Messages
      doc.fontSize(9).font('Helvetica').fillColor('#666666');
      if (config.pdf_footer_message) {
        doc.text(config.pdf_footer_message, 50, footerY + 15, { align: 'center', width: 500 });
      }
      if (config.pdf_banner_validity) {
        doc.fontSize(8).font('Helvetica-Oblique').text(config.pdf_banner_validity, 50, footerY + 30, { align: 'center', width: 500 });
      }

      doc.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new QuotesController();

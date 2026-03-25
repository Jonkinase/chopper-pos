const productsService = require('./products.service');
const configService = require('../config/config.service');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ProductsController {
  async getAll(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await productsService.getAll(sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await productsService.create(req.body, req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await productsService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await productsService.delete(req.params.id);
      res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await productsService.getById(req.params.id, sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async exportPdf(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const typeFilter = req.query.type;
      
      const config = await configService.getAll();
      const allProducts = await productsService.getAll(sucursalId);
      
      let products = allProducts;
      if (typeFilter && typeFilter !== 'all') {
        products = products.filter(p => p.type === typeFilter);
      }
      
      // Group products by type
      const grouped = {
        liquido: [],
        seco: [],
        alimento: []
      };
      
      products.forEach(p => {
        if (grouped[p.type]) {
          grouped[p.type].push(p);
        } else {
          grouped[p.type] = [p];
        }
      });
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      let filename = `Catalogo_${new Date().getTime()}.pdf`;
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
      
      // Banner
      if (config.pdf_banner_path) {
        try {
          let imageBuffer;
          if (config.pdf_banner_path.startsWith('data:')) {
            const base64Data = config.pdf_banner_path.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            const bannerPath = path.join(__dirname, '../../../public', config.pdf_banner_path);
            if (fs.existsSync(bannerPath)) imageBuffer = fs.readFileSync(bannerPath);
          }
          if (imageBuffer) {
            doc.image(imageBuffer, 50, currentY, { width: 500, height: 100 });
            currentY += 110;
          }
        } catch (e) {
          console.warn('No se pudo cargar el banner:', e.message);
        }
      }
      
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0d9488').text('Catálogo de Productos', 50, currentY, { align: 'center' });
      currentY += 30;
      
      const types = [
        { key: 'liquido', label: 'Líquidos' },
        { key: 'seco', label: 'Secos' },
        { key: 'alimento', label: 'Alimentos' }
      ];
      
      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > 750) {
          doc.addPage();
          currentY = 50;
        }
      };

      types.forEach(t => {
        const groupProducts = grouped[t.key];
        if (groupProducts && groupProducts.length > 0) {
          checkPageBreak(40);
          
          // Group Title
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#444444').text(t.label, 50, currentY);
          currentY += 20;
          
          // Table Header
          checkPageBreak(30);
          doc.rect(50, currentY, 500, 20).fill('#0d9488');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
          doc.text('Producto', 60, currentY + 6);
          doc.text('Precio Menor', 350, currentY + 6, { width: 70, align: 'center' });
          doc.text('Precio Mayor', 430, currentY + 6, { width: 70, align: 'center' });
          currentY += 20;
          
          let i = 0;
          doc.fillColor('#444444').font('Helvetica');
          groupProducts.forEach(product => {
            checkPageBreak(30);
            
            if (i % 2 !== 0) {
               doc.rect(50, currentY, 500, 25).fill('#f0fdfa');
               doc.fillColor('#444444');
            }
            
            const retailPrice = product.retail_price ? formatPrice(product.retail_price) : '-';
            const wholesalePrice = product.wholesale_price ? formatPrice(product.wholesale_price) : 'N/A';
            
            doc.text(product.name, 60, currentY + 8, { width: 280, ellipsis: true });
            doc.text(retailPrice, 350, currentY + 8, { width: 70, align: 'center' });
            doc.text(wholesalePrice, 430, currentY + 8, { width: 70, align: 'center' });
            
            currentY += 25;
            i++;
          });
          currentY += 15; // Space between groups
        }
      });
      
      doc.end();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductsController();

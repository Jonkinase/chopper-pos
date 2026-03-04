const configService = require('./config.service');
const fs = require('fs');
const path = require('path');

class ConfigController {
  async getAll(req, res, next) {
    try {
      const config = await configService.getAll();
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const allowedKeys = [
        'company_name', 
        'company_cuit', 
        'company_address', 
        'company_phone', 
        'pdf_footer_message', 
        'pdf_banner_validity'
      ];
      const updates = {};
      
      allowedKeys.forEach(key => {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      });

      await configService.update(updates);
      res.json({ success: true, message: 'Configuración actualizada' });
    } catch (err) {
      next(err);
    }
  }

  async uploadBanner(req, res, next) {
    try {
      if (!req.file) {
        throw { status: 400, message: 'No se subió ningún archivo' };
      }
      const filePath = `/assets/${req.file.filename}`;
      await configService.set('pdf_banner_path', filePath);
      res.json({ success: true, data: { path: filePath } });
    } catch (err) {
      next(err);
    }
  }

  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        throw { status: 400, message: 'No se subió ningún archivo' };
      }
      const filePath = `/assets/${req.file.filename}`;
      await configService.set('sidebar_logo_path', filePath);
      res.json({ success: true, data: { path: filePath } });
    } catch (err) {
      next(err);
    }
  }

  async deleteBanner(req, res, next) {
    try {
      const currentPath = await configService.get('pdf_banner_path');
      if (currentPath) {
        const fullPath = path.join(__dirname, '../../../public', currentPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      await configService.set('pdf_banner_path', null);
      res.json({ success: true, message: 'Banner eliminado' });
    } catch (err) {
      next(err);
    }
  }

  async deleteLogo(req, res, next) {
    try {
      const currentPath = await configService.get('sidebar_logo_path');
      if (currentPath) {
        const fullPath = path.join(__dirname, '../../../public', currentPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      await configService.set('sidebar_logo_path', null);
      res.json({ success: true, message: 'Logo eliminado' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConfigController();

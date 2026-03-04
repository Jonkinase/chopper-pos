const express = require('express');
const router = express.Router();
const configController = require('./config.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../public/assets'));
  },
  filename: (req, file, cb) => {
    const prefix = req.path.includes('banner') ? 'pdf_banner' : 'sidebar_logo';
    const ext = path.extname(file.originalname);
    cb(null, `${prefix}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, webp)'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// All routes require admin
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/', configController.getAll);
router.put('/', configController.update);

router.post('/upload/banner', upload.single('file'), configController.uploadBanner);
router.post('/upload/logo', upload.single('file'), configController.uploadLogo);

router.delete('/upload/banner', configController.deleteBanner);
router.delete('/upload/logo', configController.deleteLogo);

module.exports = router;

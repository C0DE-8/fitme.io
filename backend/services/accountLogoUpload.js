const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ACCOUNT_LOGO_DIR = path.join(__dirname, '..', 'uploads', 'account-logos');

fs.mkdirSync(ACCOUNT_LOGO_DIR, { recursive: true });

const accountLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ACCOUNT_LOGO_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const uniqueName = `${Date.now()}_${safeName}`;

    cb(null, uniqueName);
  }
});

const accountLogoFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PNG, JPG, JPEG, WEBP, or SVG images are allowed.'));
};

const uploadAccountLogo = multer({
  storage: accountLogoStorage,
  fileFilter: accountLogoFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = {
  ACCOUNT_LOGO_DIR,
  uploadAccountLogo
};

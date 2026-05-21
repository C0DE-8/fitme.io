const path = require('path');
const multer = require('multer');

const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment_proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const uploadPaymentProof = multer({ storage: paymentProofStorage });

module.exports = uploadPaymentProof;

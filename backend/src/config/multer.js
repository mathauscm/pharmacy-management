const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../middleware/logger');

// Certificar que diretório existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info('Diretório de uploads criado:', uploadDir);
}

// Configuração de storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para arquivos XML
const fileFilter = (req, file, cb) => {
  const isXML = file.mimetype === 'text/xml' || 
               file.mimetype === 'application/xml' ||
               file.originalname.toLowerCase().endsWith('.xml');
  
  if (isXML) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos XML são permitidos'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Máximo 10 arquivos por vez
  }
});

// Exports
module.exports = {
  xmlUpload: upload,
  // Para compatibilidade
  upload: upload
};

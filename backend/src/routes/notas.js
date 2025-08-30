const express = require('express');
const router = express.Router();
const multer = require('../config/multer');
const notaController = require('../controllers/notaController');
const { validateXMLUpload, validateNotaId } = require('../middleware/validator');

// Upload de XMLs
router.post('/upload', multer.xmlUpload.array('xmlFiles', 10), validateXMLUpload, notaController.uploadXML);

// Listar notas
router.get('/', notaController.getNotas);

// Obter nota por ID
router.get('/:id', validateNotaId, notaController.getNotaById);

// Excluir nota
router.delete('/:id', validateNotaId, notaController.deleteNota);

// Reprocessar XML de uma nota
router.put('/:id/reprocess', validateNotaId, multer.xmlUpload.single('xmlFile'), notaController.reprocessXML);

module.exports = router;

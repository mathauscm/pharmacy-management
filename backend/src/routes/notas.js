// ...existing code...
const express = require('express');
const router = express.Router();
const notaController = require('../controllers/notaController');

router.get('/', notaController.getNotas);

module.exports = router;
// ...existing code...

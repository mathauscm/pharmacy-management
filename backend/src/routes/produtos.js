// ...existing code...
const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/', produtoController.getProdutos);

module.exports = router;
// ...existing code...

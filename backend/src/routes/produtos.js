const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { validateProdutoId } = require('../middleware/validator');

// Listar produtos
router.get('/', produtoController.getProdutos);

// Obter produto por ID
router.get('/:id', validateProdutoId, produtoController.getProdutoById);

// Histórico de preços de um produto
router.get('/:id/historico-precos', validateProdutoId, produtoController.getHistoricoPrecos);

// Fornecedores que vendem o produto
router.get('/:id/fornecedores', validateProdutoId, produtoController.getFornecedoresProduto);

module.exports = router;

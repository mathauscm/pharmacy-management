const express = require('express');
const router = express.Router();

// Importar rotas
const notasRoutes = require('./notas');
const produtosRoutes = require('./produtos');
const fornecedoresRoutes = require('./fornecedores');
const dashboardRoutes = require('./dashboard');

// Configurar rotas
router.use('/notas', notasRoutes);
router.use('/produtos', produtosRoutes);
router.use('/fornecedores', fornecedoresRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

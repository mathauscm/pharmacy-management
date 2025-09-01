const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');
const notasRoutes = require('./notas');
const produtosRoutes = require('./produtos');
const fornecedoresRoutes = require('./fornecedores');
const dashboardRoutes = require('./dashboard');

// Configurar rotas
router.use('/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/notas', requireAuth, notasRoutes);
router.use('/produtos', requireAuth, produtosRoutes);
router.use('/fornecedores', requireAuth, fornecedoresRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);

module.exports = router;

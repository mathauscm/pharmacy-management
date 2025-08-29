// ...existing code...
const express = require('express');
const router = express.Router();
const notasRoutes = require('./notas');
const produtosRoutes = require('./produtos');
const dashboardRoutes = require('./dashboard');

router.use('/notas', notasRoutes);
router.use('/produtos', produtosRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
// ...existing code...

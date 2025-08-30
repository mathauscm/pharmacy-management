const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard principal
router.get('/', dashboardController.getDashboard);

// Produtos com estoque baixo
router.get('/estoque-baixo', dashboardController.getEstoqueBaixo);

// Métricas de desempenho
router.get('/metricas', dashboardController.getMetricas);

module.exports = router;

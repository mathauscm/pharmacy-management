const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar middlewares
const { logger, requestLogger } = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');

// Importar rotas
const routes = require('./src/routes');

// Importar configuração do banco
const { initializeDatabase } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined', { stream: logger.stream }));

// Middlewares de parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas da API
app.use('/api', routes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Error handler middleware (deve ser o último)
app.use(errorHandler);

// Inicializar banco de dados e servidor
async function startServer() {
  try {
    logger.info('Iniciando servidor...');
    
    // Inicializar banco de dados
    await initializeDatabase();
    logger.info('Banco de dados inicializado com sucesso');

    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(__dirname, 'uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      logger.info('Diretório de uploads criado');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
      logger.info(`📈 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM. Encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Recebido SIGINT. Encerrando servidor graciosamente...');
  process.exit(0);
});

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
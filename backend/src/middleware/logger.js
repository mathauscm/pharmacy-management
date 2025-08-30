const winston = require('winston');

// Criar logger winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pharmacy-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware de logger para requests
function requestLogger(req, res, next) {
  logger.info(`${req.method} ${req.url}`);
  next();
}

// Stream para morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = { logger, requestLogger };

const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'myfarm-secret-key-change-in-production';

/**
 * Middleware para verificar se o usuário está autenticado
 */
const requireAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    logger.info(`Usuário autenticado: ${decoded.email}`);
    next();
    
  } catch (error) {
    logger.error('Erro na verificação do token:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware opcional para verificar autenticação
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.authToken;
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    
    next();
    
  } catch (error) {
    // Ignora erros de token inválido para auth opcional
    next();
  }
};

/**
 * Gerar JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.photo
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verificar se email está autorizado
 */
const isAuthorizedEmail = (email) => {
  const authorizedEmails = [
    'mathauscarvalho@gmail.com',
    'bebe.qc@gmail.com',
    'farmaciapopularubj@gmail.com',
    'maressacarvalho10@gmail.com'
  ];
  
  return authorizedEmails.includes(email.toLowerCase());
};

module.exports = {
  requireAuth,
  optionalAuth,
  generateToken,
  isAuthorizedEmail,
  JWT_SECRET
};
const express = require('express');
const passport = require('../config/passport');
const { generateToken, isAuthorizedEmail } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Rota para iniciar login com Google
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

/**
 * Callback do Google OAuth
 */
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=access_denied' }),
  (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn('Falha na autenticação - usuário não encontrado');
        return res.redirect('/login?error=auth_failed');
      }
      
      // Gerar JWT token
      const token = generateToken(user);
      
      // Configurar cookie seguro
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      logger.info(`Login realizado com sucesso: ${user.email}`);
      
      // Redirecionar para o frontend com sucesso
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${redirectUrl}/auth/success?token=${token}`);
      
    } catch (error) {
      logger.error('Erro no callback do Google:', error);
      res.redirect('/login?error=server_error');
    }
  }
);

/**
 * Rota para verificar status de autenticação
 */
router.get('/me', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        photo: decoded.photo
      }
    });
    
  } catch (error) {
    logger.error('Erro ao verificar autenticação:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

/**
 * Rota para logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

/**
 * Rota para verificar se um email é autorizado (para debugging)
 */
router.get('/check-email/:email', (req, res) => {
  const email = req.params.email;
  const authorized = isAuthorizedEmail(email);
  
  res.json({
    email,
    authorized
  });
});

module.exports = router;
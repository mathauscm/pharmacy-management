const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { logger } = require('../middleware/logger');

// Lista de emails autorizados
const AUTHORIZED_EMAILS = [
  'mathauscarvalho@gmail.com',
  'bebe.qc@gmail.com',
  'farmaciapopularubj@gmail.com',
  'maressacarvalho10@gmail.com'
];

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    
    logger.info(`Tentativa de login com email: ${email}`);
    
    // Verificar se o email está autorizado
    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      logger.warn(`Acesso negado para email não autorizado: ${email}`);
      return done(null, false, { message: 'Email não autorizado' });
    }
    
    const user = {
      id: profile.id,
      email: email,
      name: profile.displayName,
      photo: profile.photos[0]?.value,
      provider: 'google'
    };
    
    logger.info(`Login autorizado para: ${email}`);
    return done(null, user);
    
  } catch (error) {
    logger.error('Erro na autenticação Google:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
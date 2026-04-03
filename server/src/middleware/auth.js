const { verifyToken } = require('../utils/auth');
const User = require('../models/User');

// Middleware pour vérifier l'authentification
const authMiddleware = async (req, res, next) => {
  // If a preceding middleware (e.g. instanceAuthMiddleware) already authenticated the request, skip
  if (req.user) return next();
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Enlever 'Bearer '

    // Vérifier le token
    const decoded = verifyToken(token);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    // Détecter spécifiquement les JWT expirés
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    // Autre erreur de token (invalide, malformé, etc.)
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }
};

// Exporter avec un alias pour compatibilité
module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;

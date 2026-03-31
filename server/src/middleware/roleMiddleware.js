const User = require('../models/User');

// Vérifier si l'utilisateur a le rôle requis
exports.checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!User.hasRole(req.user.role, requiredRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

// Vérifier si l'utilisateur est admin
exports.isAdmin = exports.checkRole('admin');

// Vérifier si l'utilisateur est mod ou admin
exports.isMod = exports.checkRole('mod');

// Vérifier si l'utilisateur peut gérer d'autres utilisateurs
exports.canManageUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Les admins peuvent tout faire
  if (req.user.role === 'admin') {
    return next();
  }

  // Les mods peuvent gérer les utilisateurs mais pas les admins et autres mods
  if (req.user.role === 'mod') {
    // TODO: Ajouter des logiques spécifiques pour les mods
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Permissions insuffisantes'
  });
};

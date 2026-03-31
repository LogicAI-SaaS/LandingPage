const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Route publique - Inscription
router.post('/register', register);

// Route publique - Connexion
router.post('/login', login);

// Route protégée - Obtenir le profil
router.get('/profile', authMiddleware, getProfile);

module.exports = router;

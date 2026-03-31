const express = require('express');
const router = express.Router();
const discordController = require('../controllers/discordController');
const authMiddleware = require('../middleware/auth');

// Obtenir l'URL d'autorisation Discord
router.get('/auth-url', discordController.getDiscordAuthUrl);

// Callback Discord (échange de code contre token)
router.post('/callback', discordController.discordCallback);

// Lier un compte Discord (nécessite d'être connecté)
router.post('/link', authMiddleware, discordController.linkDiscord);

module.exports = router;

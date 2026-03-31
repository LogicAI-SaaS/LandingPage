const express = require('express');
const router = express.Router();
const { generateWorkflow, healthCheck } = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// Route protégée - Générer un workflow avec l'IA
router.post('/generate-workflow', authMiddleware, generateWorkflow);

// Route publique - Health check du service AI
router.get('/health', healthCheck);

module.exports = router;

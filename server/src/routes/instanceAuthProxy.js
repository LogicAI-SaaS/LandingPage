const express = require('express');
const router = express.Router();
const { getInstanceAuthToken, getInstanceDirectToken } = require('../controllers/instanceAuthProxyController');
const authMiddleware = require('../middleware/auth');

/**
 * Routes pour l'authentification proxy vers les instances
 * Permet aux utilisateurs de se connecter automatiquement à leurs instances
 */

// Générer un token d'authentification pour une instance
// POST /api/instance/:uuid/auth-token
router.post('/:uuid/auth-token', authMiddleware, getInstanceAuthToken);

// Alternative : Générer un token direct sans créer d'utilisateur
// POST /api/instance/:uuid/direct-token
router.post('/:uuid/direct-token', authMiddleware, getInstanceDirectToken);

module.exports = router;

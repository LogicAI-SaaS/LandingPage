const express = require('express');
const router = express.Router();
const {
  signup,
  validateKey,
  activateKey,
  generateKey,
  getAllSignups,
  getAllKeys,
  approveSignup
} = require('../controllers/betaController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.post('/signup', signup);
router.post('/validate-key', validateKey);

// Routes protégées (nécessitent authentification)
router.post('/activate-key', authMiddleware, activateKey);

// Routes admin (nécessitent authentification + rôle admin)
router.post('/admin/generate-key', authMiddleware, generateKey);
router.get('/admin/signups', authMiddleware, getAllSignups);
router.get('/admin/keys', authMiddleware, getAllKeys);
router.post('/admin/approve/:id', authMiddleware, approveSignup);

module.exports = router;

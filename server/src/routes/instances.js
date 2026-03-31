const express = require('express');
const router = express.Router();
const instanceController = require('../controllers/instanceController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Créer une nouvelle instance
router.post('/create', instanceController.createInstance);

// Récupérer toutes les instances de l'utilisateur
router.get('/list', instanceController.getInstances);

// Récupérer une instance par UUID
router.get('/:uuid', instanceController.getInstance);

// Arrêter une instance
router.post('/:uuid/stop', instanceController.stopInstance);

// Démarrer une instance
router.post('/:uuid/start', instanceController.startInstance);

// Supprimer une instance
router.delete('/:uuid', instanceController.deleteInstance);

// Définir le mot de passe N8N
router.put('/:uuid/password', instanceController.setPassword);

module.exports = router;

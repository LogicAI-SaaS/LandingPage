const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { isAdmin, canManageUsers } = require('../middleware/roleMiddleware');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Statistiques globales (admin)
router.get('/stats', isAdmin, adminController.getStats);

// Gestion des utilisateurs (admin)
router.get('/users', isAdmin, adminController.getAllUsers);
router.get('/users/:userId', isAdmin, adminController.getUserById);
router.put('/users/:userId/plan', canManageUsers, adminController.updateUserPlan);
router.patch('/users/:userId/role', isAdmin, adminController.updateUserRole);
router.delete('/users/:userId', isAdmin, adminController.deleteUser);

// Gestion des instances (admin)
router.get('/instances', isAdmin, adminController.getAllInstances);

// Accorder l'accès à une instance (admin ou mod)
router.post('/instances/:instanceId/grant-access', authMiddleware, adminController.grantInstanceAccess);

module.exports = router;

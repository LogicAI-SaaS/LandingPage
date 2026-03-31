const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleMiddleware');

// Routes publiques (accessibles sans authentification)
// Récupérer tous les plans actifs (pour la page de pricing)
router.get('/public', planController.getAllPlans);

// Comparer deux plans (DOIT être avant /public/:planName pour éviter les conflits)
router.get('/public/compare', planController.comparePlans);

// Récupérer un plan spécifique par son nom
router.get('/public/:planName', planController.getPlanByName);

// Routes admin uniquement (AVANT les routes avec paramètres génériques)
// Récupérer tous les plans (incluant inactifs)
router.get('/admin/all', authenticateToken, isAdmin, planController.getAllPlansAdmin);

// Récupérer les statistiques d'utilisation des plans
router.get('/admin/stats', authenticateToken, isAdmin, planController.getPlanStats);

// Créer un nouveau plan
router.post('/admin', authenticateToken, isAdmin, planController.createPlan);

// Mettre à jour un plan
router.put('/admin/:planId', authenticateToken, isAdmin, planController.updatePlan);

// Activer/désactiver un plan
router.patch('/admin/:planId/toggle', authenticateToken, isAdmin, planController.togglePlanStatus);

// Supprimer un plan (soft delete)
router.delete('/admin/:planId', authenticateToken, isAdmin, planController.deletePlan);

// Routes protégées (nécessitent une authentification)
// Récupérer les limites d'un plan (DOIT être APRÈS toutes les routes spécifiques)
router.get('/:planName/limits', authenticateToken, planController.getPlanLimits);

module.exports = router;

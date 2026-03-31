const Plan = require('../models/Plan');
const User = require('../models/User');

// Récupérer tous les plans actifs
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.findAllActive();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get all plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans',
      error: error.message
    });
  }
};

// Récupérer un plan spécifique par son nom
exports.getPlanByName = async (req, res) => {
  try {
    const { planName } = req.params;
    const plan = await Plan.findByName(planName);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get plan by name error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du plan',
      error: error.message
    });
  }
};

// Récupérer les limites d'un plan
exports.getPlanLimits = async (req, res) => {
  try {
    const { planName } = req.params;
    const limits = await Plan.getLimits(planName);

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Get plan limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des limites',
      error: error.message
    });
  }
};

// Comparer deux plans
exports.comparePlans = async (req, res) => {
  try {
    const { plan1, plan2 } = req.query;

    if (!plan1 || !plan2) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir deux noms de plans à comparer'
      });
    }

    const comparison = await Plan.comparePlans(plan1, plan2);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Compare plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la comparaison des plans',
      error: error.message
    });
  }
};

// ADMIN ONLY: Créer un nouveau plan
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      display_name,
      description,
      price_monthly,
      price_yearly,
      max_instances,
      max_workflows,
      max_storage_gb,
      max_executions_per_month,
      features
    } = req.body;

    // Validation
    if (!name || !display_name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du plan et le nom d\'affichage sont requis'
      });
    }

    const planId = await Plan.create({
      name,
      display_name,
      description,
      price_monthly: price_monthly || 0,
      price_yearly: price_yearly || 0,
      max_instances: max_instances || 1,
      max_workflows: max_workflows || 10,
      max_storage_gb: max_storage_gb || 1,
      max_executions_per_month: max_executions_per_month || 1000,
      features: features || {}
    });

    const newPlan = await Plan.findById(planId);

    res.status(201).json({
      success: true,
      message: 'Plan créé avec succès',
      data: newPlan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Un plan avec ce nom existe déjà'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du plan',
      error: error.message
    });
  }
};

// ADMIN ONLY: Mettre à jour un plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // Vérifier que le plan existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    // Ne pas permettre de changer le nom du plan
    delete updates.name;

    await Plan.update(planId, updates);
    const updatedPlan = await Plan.findById(planId);

    res.json({
      success: true,
      message: 'Plan mis à jour avec succès',
      data: updatedPlan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du plan',
      error: error.message
    });
  }
};

// ADMIN ONLY: Activer/désactiver un plan
exports.togglePlanStatus = async (req, res) => {
  try {
    const { planId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut doit être un booléen'
      });
    }

    // Vérifier que le plan existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    await Plan.toggleActive(planId, is_active);

    res.json({
      success: true,
      message: `Plan ${is_active ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Toggle plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut du plan',
      error: error.message
    });
  }
};

// ADMIN ONLY: Supprimer un plan (soft delete)
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Vérifier que le plan existe
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    // Ne pas permettre de supprimer le plan free
    if (plan.name === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer le plan gratuit'
      });
    }

    await Plan.delete(planId);

    res.json({
      success: true,
      message: 'Plan désactivé avec succès'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du plan',
      error: error.message
    });
  }
};

// ADMIN ONLY: Récupérer tous les plans (incluant inactifs)
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await Plan.findAll();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get all plans (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans',
      error: error.message
    });
  }
};

// Récupérer les statistiques d'utilisation des plans
exports.getPlanStats = async (req, res) => {
  try {
    const prisma = require('../config/database');

    const stats = await prisma.$queryRaw`
      SELECT
        u.plan,
        COUNT(u.id)::int AS user_count,
        COUNT(i.id)::int AS instance_count,
        p.display_name AS plan_name
      FROM users u
      LEFT JOIN instances i ON u.id = i.user_id AND i.status != 'deleted'
      LEFT JOIN plans p ON u.plan::text = p.name::text
      GROUP BY u.plan, p.display_name
      ORDER BY user_count DESC
    `;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get plan stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

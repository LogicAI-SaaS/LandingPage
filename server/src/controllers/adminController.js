const User = require('../models/User');
const Instance = require('../models/Instance');
const BetaAccess = require('../models/BetaAccess');
const prisma = require('../config/database');

// Obtenir les détails d'un utilisateur avec ses instances (admin seulement)
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les instances de l'utilisateur
    const instances = await Instance.findByUserId(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          plan: user.plan,
          role: user.role,
          has_beta_access: user.has_beta_access || false,
          beta_access_id: user.beta_access_id,
          created_at: user.created_at
        },
        instances: instances.map(instance => ({
          id: instance.id,
          uuid: instance.uuid,
          name: instance.name,
          subdomain: instance.subdomain,
          port: instance.port,
          status: instance.status,
          user_id: instance.user_id,
          created_at: instance.created_at
        })),
        stats: {
          totalInstances: instances.length,
          activeInstances: instances.filter(i => i.status === 'running').length,
          stoppedInstances: instances.filter(i => i.status === 'stopped').length
        }
      }
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        plan: user.plan,
        role: user.role,
        has_beta_access: user.has_beta_access || false,
        beta_access_id: user.beta_access_id,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir toutes les instances (admin seulement)
exports.getAllInstances = async (req, res) => {
  try {
    const instances = await Instance.findAll();

    res.json({
      success: true,
      data: instances.map(instance => ({
        id: instance.id,
        uuid: instance.uuid,
        name: instance.name,
        subdomain: instance.subdomain,
        port: instance.port,
        status: instance.status,
        created_at: instance.created_at
      }))
    });
  } catch (error) {
    console.error('Get all instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Mettre à jour le plan d'un utilisateur
exports.updateUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!User.isValidPlan(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Plan invalide. Options: free, pro, business, corporation'
      });
    }

    await User.updatePlan(userId, plan);

    res.json({
      success: true,
      message: 'Plan mis à jour avec succès',
      data: { plan }
    });
  } catch (error) {
    console.error('Update user plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Mettre à jour le rôle d'un utilisateur
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const requesterRole = req.user.role;

    if (!['user', 'mod', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Options: user, mod, admin'
      });
    }

    // Récupérer l'utilisateur cible pour vérifier son rôle actuel
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Définir la hiérarchie des rôles
    const roleHierarchy = { user: 0, mod: 1, admin: 2 };

    // Vérifier si le demandeur peut modifier cet utilisateur
    // On ne peut pas modifier un rôle égal ou supérieur au sien
    if (roleHierarchy[targetUser.role] >= roleHierarchy[requesterRole]) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier le rôle d\'un utilisateur avec un rôle égal ou supérieur au vôtre'
      });
    }

    // Empêcher de promouvoir quelqu'un à un rôle égal ou supérieur au sien
    if (roleHierarchy[role] >= roleHierarchy[requesterRole]) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas promouvoir quelqu\'un à un rôle égal ou supérieur au vôtre'
      });
    }

    // Empêcher un admin de se rétrograder lui-même
    if (parseInt(userId) === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas rétrograder votre propre compte admin'
      });
    }

    await User.updateRole(userId, role);

    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      data: { role }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir les statistiques globales (admin)
exports.getStats = async (req, res) => {
  try {
    const users = await User.findAll();
    const instances = await Instance.findAll();
    const pendingBeta = await BetaAccess.getPendingCount();

    const stats = {
      totalUsers: users.length,
      totalInstances: instances.length,
      activeInstances: instances.filter(i => i.status === 'running').length,
      pendingBeta: pendingBeta
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Supprimer un utilisateur (admin seulement)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Empêcher la suppression de son propre compte
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer l'utilisateur (les instances seront supprimées en cascade grâce à la FK)
    await prisma.user.delete({ where: { id: Number(userId) } });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Accorder l'accès à une instance pour un admin/mod
exports.grantInstanceAccess = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { userId, role = 'admin' } = req.body; // role peut être 'viewer', 'collaborator', 'admin'

    // Vérifier que l'utilisateur a les droits (doit être admin ou mod)
    if (!['admin', 'mod'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour accorder l\'accès à cette instance'
      });
    }

    // Vérifier que l'instance existe
    const instance = await Instance.findById(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instance non trouvée'
      });
    }

    // Vérifier si l'utilisateur a déjà accès
    const existing = await prisma.instanceMember.findFirst({
      where: { instanceId: Number(instanceId), userId: Number(userId) },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur a déjà accès à cette instance'
      });
    }

    // Ajouter l'accès
    const user = await User.findById(userId);
    await prisma.instanceMember.create({
      data: {
        instanceId: Number(instanceId),
        userId: Number(userId),
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role,
        invitationStatus: 'accepted',
      },
    });

    res.json({
      success: true,
      message: 'Accès accordé avec succès',
      data: { instanceId, userId, role }
    });
  } catch (error) {
    console.error('Grant instance access error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};


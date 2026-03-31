const { promisePool } = require('../config/database');

class User {
  // Créer un nouvel utilisateur
  static async create({ email, password, firstName, lastName, plan = 'free', role = 'user' }) {
    try {
      const sql = `
        INSERT INTO users (email, password, first_name, last_name, plan, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await promisePool.execute(sql, [email, password, firstName, lastName, plan, role]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const [rows] = await promisePool.execute(sql, [email]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    try {
      const sql = 'SELECT id, email, first_name, last_name, plan, role, created_at FROM users WHERE id = ?';
      const [rows] = await promisePool.execute(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le plan de l'utilisateur
  static async updatePlan(id, plan) {
    try {
      const sql = 'UPDATE users SET plan = ? WHERE id = ?';
      await promisePool.execute(sql, [plan, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le rôle de l'utilisateur
  static async updateRole(id, role) {
    try {
      const sql = 'UPDATE users SET role = ? WHERE id = ?';
      await promisePool.execute(sql, [role, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer tous les utilisateurs (pour les admins)
  static async findAll() {
    try {
      const sql = 'SELECT id, email, first_name, last_name, plan, role, created_at FROM users ORDER BY created_at DESC';
      const [rows] = await promisePool.execute(sql);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Vérifier si l'utilisateur a un rôle spécifique ou supérieur
  static hasRole(userRole, requiredRole) {
    const roleHierarchy = { user: 0, mod: 1, admin: 2 };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Obtenir les limites du plan
  static async getPlanLimits(plan) {
    try {
      // Essayer de récupérer depuis la table plans
      const Plan = require('./Plan');
      const limits = await Plan.getLimits(plan);
      return limits;
    } catch (error) {
      // Fallback sur les valeurs par défaut si la table plans n'existe pas encore
      const limits = {
        free: { max_instances: 1, max_workflows: 10, max_storage_gb: 1, max_executions_per_month: 1000 },
        pro: { max_instances: 5, max_workflows: 100, max_storage_gb: 10, max_executions_per_month: 50000 },
        business: { max_instances: 20, max_workflows: -1, max_storage_gb: 50, max_executions_per_month: 500000 },
        corporation: { max_instances: -1, max_workflows: -1, max_storage_gb: -1, max_executions_per_month: -1 } // -1 = illimité
      };
      return limits[plan] || limits.free;
    }
  }

  // Version synchrone pour compatibilité (deprecated)
  static getPlanLimitsSync(plan) {
    const limits = {
      free: { max_instances: 1, max_workflows: 10, max_storage_gb: 1, max_executions_per_month: 1000 },
      pro: { max_instances: 5, max_workflows: 100, max_storage_gb: 10, max_executions_per_month: 50000 },
      business: { max_instances: 20, max_workflows: -1, max_storage_gb: 50, max_executions_per_month: 500000 },
      corporation: { max_instances: -1, max_workflows: -1, max_storage_gb: -1, max_executions_per_month: -1 } // -1 = illimité
    };
    return limits[plan] || limits.free;
  }

  // Vérifier si un plan est valide
  static isValidPlan(plan) {
    return ['free', 'pro', 'business', 'corporation'].includes(plan);
  }
}

module.exports = User;

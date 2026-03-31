const { promisePool } = require('../config/database');

class Plan {
  // Créer un nouveau plan
  static async create({ 
    name, 
    display_name, 
    description, 
    price_monthly, 
    price_yearly,
    max_instances, 
    max_workflows,
    max_storage_gb,
    max_executions_per_month,
    features,
    is_active = true 
  }) {
    try {
      const sql = `
        INSERT INTO plans (
          name, display_name, description, 
          price_monthly, price_yearly,
          max_instances, max_workflows, max_storage_gb, max_executions_per_month,
          features, is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const featuresJson = JSON.stringify(features);
      const [result] = await promisePool.execute(sql, [
        name, display_name, description,
        price_monthly, price_yearly,
        max_instances, max_workflows, max_storage_gb, max_executions_per_month,
        featuresJson, is_active
      ]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Trouver un plan par nom
  static async findByName(name) {
    try {
      const sql = 'SELECT * FROM plans WHERE name = ?';
      const [rows] = await promisePool.execute(sql, [name]);
      if (rows[0] && rows[0].features) {
        rows[0].features = JSON.parse(rows[0].features);
      }
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Trouver un plan par ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM plans WHERE id = ?';
      const [rows] = await promisePool.execute(sql, [id]);
      if (rows[0] && rows[0].features) {
        rows[0].features = JSON.parse(rows[0].features);
      }
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer tous les plans actifs
  static async findAllActive() {
    try {
      const sql = 'SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC';
      const [rows] = await promisePool.execute(sql);
      return rows.map(row => {
        if (row.features) {
          row.features = JSON.parse(row.features);
        }
        return row;
      });
    } catch (error) {
      throw error;
    }
  }

  // Récupérer tous les plans (y compris inactifs)
  static async findAll() {
    try {
      const sql = 'SELECT * FROM plans ORDER BY price_monthly ASC';
      const [rows] = await promisePool.execute(sql);
      return rows.map(row => {
        if (row.features) {
          row.features = JSON.parse(row.features);
        }
        return row;
      });
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un plan
  static async update(id, updates) {
    try {
      const allowedFields = [
        'display_name', 'description', 
        'price_monthly', 'price_yearly',
        'max_instances', 'max_workflows', 'max_storage_gb', 'max_executions_per_month',
        'features', 'is_active'
      ];
      
      const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
      if (fields.length === 0) return false;

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => {
        if (field === 'features' && typeof updates[field] === 'object') {
          return JSON.stringify(updates[field]);
        }
        return updates[field];
      });
      
      const sql = `UPDATE plans SET ${setClause} WHERE id = ?`;
      await promisePool.execute(sql, [...values, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Activer/désactiver un plan
  static async toggleActive(id, isActive) {
    try {
      const sql = 'UPDATE plans SET is_active = ? WHERE id = ?';
      await promisePool.execute(sql, [isActive ? 1 : 0, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer un plan (soft delete)
  static async delete(id) {
    try {
      // On désactive plutôt que de supprimer pour préserver l'intégrité des données
      const sql = 'UPDATE plans SET is_active = 0 WHERE id = ?';
      await promisePool.execute(sql, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Obtenir les limites d'un plan par son nom
  static async getLimits(planName) {
    try {
      const plan = await this.findByName(planName);
      if (!plan) {
        // Retourner les limites du plan free par défaut
        return {
          max_instances: 1,
          max_workflows: 10,
          max_storage_gb: 1,
          max_executions_per_month: 1000
        };
      }
      return {
        max_instances: plan.max_instances,
        max_workflows: plan.max_workflows,
        max_storage_gb: plan.max_storage_gb,
        max_executions_per_month: plan.max_executions_per_month
      };
    } catch (error) {
      throw error;
    }
  }

  // Comparer deux plans
  static async comparePlans(planName1, planName2) {
    try {
      const [plan1, plan2] = await Promise.all([
        this.findByName(planName1),
        this.findByName(planName2)
      ]);
      
      return {
        plan1: plan1,
        plan2: plan2,
        comparison: {
          price_difference: plan2 ? (plan2.price_monthly - plan1.price_monthly) : 0,
          instance_difference: plan2 ? (plan2.max_instances - plan1.max_instances) : 0,
          workflow_difference: plan2 ? (plan2.max_workflows - plan1.max_workflows) : 0
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Plan;

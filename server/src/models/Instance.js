const { promisePool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Instance {
  // Créer une nouvelle instance
  static async create({ userId, name, status = 'creating', deploymentType = 'cloud' }) {
    try {
      const uuid = uuidv4().substring(0, 8); // Prendre les 8 premiers caractères
      const subdomain = `${uuid}.logicai.fr`;
      const sql = `
        INSERT INTO instances (user_id, name, uuid, subdomain, status, deployment_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await promisePool.execute(sql, [userId, name, uuid, subdomain, status, deploymentType]);
      return {
        id: result.insertId,
        uuid,
        subdomain,
        name,
        status,
        deployment_type: deploymentType
      };
    } catch (error) {
      throw error;
    }
  }

  // Trouver toutes les instances d'un utilisateur
  static async findByUserId(userId) {
    try {
      const sql = 'SELECT * FROM instances WHERE user_id = ? ORDER BY created_at DESC';
      const [rows] = await promisePool.execute(sql, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Trouver toutes les instances (admin)
  static async findAll() {
    try {
      const sql = 'SELECT * FROM instances ORDER BY created_at DESC';
      const [rows] = await promisePool.execute(sql);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Trouver une instance par UUID
  static async findByUuid(uuid) {
    try {
      const sql = 'SELECT * FROM instances WHERE uuid = ?';
      const [rows] = await promisePool.execute(sql, [uuid]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Trouver une instance par ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM instances WHERE id = ?';
      const [rows] = await promisePool.execute(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le statut d'une instance
  static async updateStatus(id, status) {
    try {
      const sql = 'UPDATE instances SET status = ? WHERE id = ?';
      await promisePool.execute(sql, [status, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le port d'une instance
  static async updatePort(id, port) {
    try {
      const sql = 'UPDATE instances SET port = ? WHERE id = ?';
      await promisePool.execute(sql, [port, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le container_id d'une instance
  static async updateContainerId(id, containerId) {
    try {
      const sql = 'UPDATE instances SET container_id = ? WHERE id = ?';
      await promisePool.execute(sql, [containerId, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer une instance
  static async delete(id) {
    try {
      const sql = 'DELETE FROM instances WHERE id = ?';
      await promisePool.execute(sql, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Compter les instances actives d'un utilisateur (uniquement cloud pour le quota)
  static async countByUserId(userId, includeLocal = false) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND status != "deleted"';

      // Si on ne compte pas les locales, on filtre sur deployment_type
      if (!includeLocal) {
        sql += ' AND deployment_type = "cloud"';
      }

      const [rows] = await promisePool.execute(sql, [userId]);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Compter uniquement les instances cloud
  static async countCloudInstances(userId) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND deployment_type = "cloud" AND status != "deleted"';
      const [rows] = await promisePool.execute(sql, [userId]);
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour l'URL publique (pour ngrok ou domaine personnalisé)
  static async updatePublicUrl(id, publicUrl) {
    try {
      const sql = 'UPDATE instances SET public_url = ? WHERE id = ?';
      await promisePool.execute(sql, [publicUrl, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le mot de passe temporaire
  static async updateTempPassword(id, tempPassword) {
    try {
      const sql = 'UPDATE instances SET temp_password = ? WHERE id = ?';
      await promisePool.execute(sql, [tempPassword, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour l'email N8N
  static async updateN8nEmail(id, email) {
    try {
      const sql = 'UPDATE instances SET n8n_email = ? WHERE id = ?';
      await promisePool.execute(sql, [email, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Marquer le mot de passe comme défini
  static async markPasswordSet(id) {
    try {
      const sql = 'UPDATE instances SET password_set = TRUE, temp_password = NULL WHERE id = ?';
      await promisePool.execute(sql, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Vérifier si le mot de passe a été défini
  static async isPasswordSet(id) {
    try {
      const sql = 'SELECT password_set FROM instances WHERE id = ?';
      const [rows] = await promisePool.execute(sql, [id]);
      return rows[0]?.password_set || false;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le mot de passe hashé de l'instance (pour auto-login)
  static async updateInstancePassword(id, passwordHash) {
    try {
      const sql = 'UPDATE instances SET temp_password = ? WHERE id = ?';
      await promisePool.execute(sql, [passwordHash, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer le mot de passe hashé de l'instance
  static async getInstancePassword(id) {
    try {
      const sql = 'SELECT temp_password FROM instances WHERE id = ?';
      const [rows] = await promisePool.execute(sql, [id]);
      return rows[0]?.temp_password || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Instance;

const { promisePool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class InstanceMember {
  // Créer un membre d'instance
  static async create({ instanceId, userId, email, name, role = 'viewer' }) {
    try {
      const invitationToken = uuidv4();
      const sql = `
        INSERT INTO instance_members (instance_id, user_id, email, name, role, invitation_token)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await promisePool.execute(sql, [instanceId, userId, email, name, role, invitationToken]);
      return {
        id: result.insertId,
        instanceId,
        userId,
        email,
        name,
        role,
        invitationToken
      };
    } catch (error) {
      throw error;
    }
  }

  // Trouver tous les membres d'une instance
  static async findByInstanceId(instanceId) {
    try {
      const sql = 'SELECT * FROM instance_members WHERE instance_id = ? ORDER BY created_at ASC';
      const [rows] = await promisePool.execute(sql, [instanceId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Trouver un membre par ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM instance_members WHERE id = ?';
      const [rows] = await promisePool.execute(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Trouver un membre par token d'invitation
  static async findByInvitationToken(token) {
    try {
      const sql = 'SELECT * FROM instance_members WHERE invitation_token = ?';
      const [rows] = await promisePool.execute(sql, [token]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le rôle d'un membre
  static async updateRole(id, role) {
    try {
      const sql = 'UPDATE instance_members SET role = ? WHERE id = ?';
      await promisePool.execute(sql, [role, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour le statut d'invitation
  static async updateInvitationStatus(id, status) {
    try {
      const sql = 'UPDATE instance_members SET invitation_status = ? WHERE id = ?';
      await promisePool.execute(sql, [status, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Accepter une invitation (lier l'utilisateur)
  static async acceptInvitation(memberId, userId) {
    try {
      const sql = 'UPDATE instance_members SET user_id = ?, invitation_status = ? WHERE id = ?';
      await promisePool.execute(sql, [userId, 'accepted', memberId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Définir le mot de passe N8N d'un membre
  static async setN8nPassword(id, tempPassword) {
    try {
      const sql = 'UPDATE instance_members SET temp_password = ? WHERE id = ?';
      await promisePool.execute(sql, [tempPassword, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Marquer le mot de passe comme défini
  static async markPasswordSet(id) {
    try {
      const sql = 'UPDATE instance_members SET password_set = TRUE, temp_password = NULL WHERE id = ?';
      await promisePool.execute(sql, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer un membre
  static async delete(id) {
    try {
      const sql = 'DELETE FROM instance_members WHERE id = ?';
      await promisePool.execute(sql, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Trouver les instances où l'utilisateur est membre (invitation acceptée)
  static async findAcceptedInstancesByUserId(userId) {
    try {
      const sql = `
        SELECT i.*, im.role as member_role
        FROM instances i
        JOIN instance_members im ON im.instance_id = i.id
        WHERE im.user_id = ? AND im.invitation_status = 'accepted'
        ORDER BY i.created_at DESC
      `;
      const [rows] = await promisePool.execute(sql, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Trouver les invitations d'un utilisateur
  static async findPendingInvitationsByEmail(email) {
    try {
      const sql = 'SELECT im.*, i.name as instance_name, i.uuid as instance_uuid, u.email as owner_email FROM instance_members im JOIN instances i ON im.instance_id = i.id JOIN users u ON i.user_id = u.id WHERE im.email = ? AND im.invitation_status = ? AND im.user_id IS NULL';
      const [rows] = await promisePool.execute(sql, [email, 'pending']);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = InstanceMember;

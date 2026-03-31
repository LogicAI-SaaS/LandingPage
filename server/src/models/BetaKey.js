const { promisePool } = require('../config/database');

class BetaKey {
  static async create(keyCode, maxUses, createdBy, expiresAt = null) {
    const sql = 'INSERT INTO beta_keys (key_code, max_uses, created_by, expires_at) VALUES (?, ?, ?, ?)';
    const [result] = await promisePool.execute(sql, [keyCode, maxUses, createdBy, expiresAt]);
    return result.insertId;
  }

  static async findByKeyCode(keyCode) {
    const sql = 'SELECT * FROM beta_keys WHERE key_code = ? AND is_active = 1';
    const [rows] = await promisePool.execute(sql, [keyCode]);
    return rows[0];
  }

  static async incrementUsage(keyCode) {
    const sql = 'UPDATE beta_keys SET used_count = used_count + 1 WHERE key_code = ?';
    await promisePool.execute(sql, [keyCode]);
  }

  static async getAll() {
    const sql = `
      SELECT bk.*, u.email as created_by_email, u.first_name, u.last_name
      FROM beta_keys bk
      LEFT JOIN users u ON bk.created_by = u.id
      ORDER BY bk.created_at DESC
    `;
    const [rows] = await promisePool.execute(sql);
    return rows;
  }

  static async deactivate(id) {
    const sql = 'UPDATE beta_keys SET is_active = 0 WHERE id = ?';
    await promisePool.execute(sql, [id]);
  }

  static generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'BETA-';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}

module.exports = BetaKey;

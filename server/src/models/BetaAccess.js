const { promisePool } = require('../config/database');

class BetaAccess {
  static async create(email) {
    const sql = 'INSERT INTO beta_access (email, status) VALUES (?, ?)';
    const [result] = await promisePool.execute(sql, [email, 'pending']);
    return result.insertId;
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM beta_access WHERE email = ?';
    const [rows] = await promisePool.execute(sql, [email]);
    return rows[0];
  }

  static async updateStatus(id, status) {
    const sql = 'UPDATE beta_access SET status = ? WHERE id = ?';
    await promisePool.execute(sql, [status, id]);
  }

  static async assignKey(id, betaKey) {
    const sql = 'UPDATE beta_access SET beta_key = ?, status = ? WHERE id = ?';
    await promisePool.execute(sql, [betaKey, 'approved', id]);
  }

  static async getPendingCount() {
    const sql = 'SELECT COUNT(*) as count FROM beta_access WHERE status = ?';
    const [rows] = await promisePool.execute(sql, ['pending']);
    return rows[0].count;
  }

  static async getAllPending() {
    const sql = 'SELECT * FROM beta_access WHERE status = ? ORDER BY created_at DESC';
    const [rows] = await promisePool.execute(sql, ['pending']);
    return rows;
  }

  static async getAll() {
    const sql = 'SELECT * FROM beta_access ORDER BY created_at DESC';
    const [rows] = await promisePool.execute(sql);
    return rows;
  }
}

module.exports = BetaAccess;

const prisma = require('../config/database');

function mapBeta(b) {
  if (!b) return null;
  return {
    id: b.id,
    email: b.email,
    beta_key: b.betaKey,
    betaKey: b.betaKey,
    status: b.status,
    created_at: b.createdAt,
    createdAt: b.createdAt,
    updated_at: b.updatedAt,
    updatedAt: b.updatedAt,
  };
}

class BetaAccess {
  static async create(email) {
    const b = await prisma.betaAccess.create({ data: { email } });
    return b.id;
  }

  static async findByEmail(email) {
    const b = await prisma.betaAccess.findUnique({ where: { email } });
    return mapBeta(b);
  }

  static async updateStatus(id, status) {
    await prisma.betaAccess.update({ where: { id: Number(id) }, data: { status } });
  }

  static async assignKey(id, betaKey) {
    await prisma.betaAccess.update({ where: { id: Number(id) }, data: { betaKey, status: 'approved' } });
  }

  static async getPendingCount() {
    return prisma.betaAccess.count({ where: { status: 'pending' } });
  }

  static async getAllPending() {
    const rows = await prisma.betaAccess.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapBeta);
  }

  static async getAll() {
    const rows = await prisma.betaAccess.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mapBeta);
  }
}

module.exports = BetaAccess;

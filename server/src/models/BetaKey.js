const prisma = require('../config/database');

function mapKey(k) {
  if (!k) return null;
  return {
    id: k.id,
    key_code: k.keyCode,
    keyCode: k.keyCode,
    max_uses: k.maxUses,
    maxUses: k.maxUses,
    used_count: k.usedCount,
    usedCount: k.usedCount,
    is_active: k.isActive,
    isActive: k.isActive,
    created_by: k.createdById,
    createdById: k.createdById,
    expires_at: k.expiresAt,
    expiresAt: k.expiresAt,
    created_at: k.createdAt,
    createdAt: k.createdAt,
    created_by_email: k.createdBy?.email ?? null,
    first_name: k.createdBy?.firstName ?? null,
    last_name: k.createdBy?.lastName ?? null,
  };
}

class BetaKey {
  static async create(keyCode, maxUses, createdBy, expiresAt = null) {
    const k = await prisma.betaKey.create({
      data: {
        keyCode,
        maxUses,
        createdById: Number(createdBy),
        expiresAt: expiresAt ?? undefined,
      },
    });
    return k.id;
  }

  static async findByKeyCode(keyCode) {
    const k = await prisma.betaKey.findFirst({ where: { keyCode, isActive: true } });
    return mapKey(k);
  }

  static async incrementUsage(keyCode) {
    await prisma.betaKey.update({
      where: { keyCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  static async getAll() {
    const rows = await prisma.betaKey.findMany({
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapKey);
  }

  static async deactivate(id) {
    await prisma.betaKey.update({ where: { id: Number(id) }, data: { isActive: false } });
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

/**
 * Exemples de migration MySQL → Prisma
 * Ce fichier montre comment convertir les services existants
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// USER SERVICE
// ============================================

class UserService {
  // ❌ ANCIEN CODE MySQL
  static async findByEmailOld(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await promisePool.execute(sql, [email]);
    return rows[0] || null;
  }

  // ✅ NOUVEAU CODE Prisma
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // ❌ ANCIEN CODE MySQL
  static async updatePlanOld(id, plan) {
    const sql = 'UPDATE users SET plan = ? WHERE id = ?';
    await promisePool.execute(sql, [plan, id]);
    return true;
  }

  // ✅ NOUVEAU CODE Prisma
  static async updatePlan(id, plan) {
    await prisma.user.update({
      where: { id },
      data: { plan }
    });
    return true;
  }

  // ❌ ANCIEN CODE MySQL
  static async findAllOld() {
    const sql = 'SELECT id, email, first_name, last_name, plan, role, created_at FROM users ORDER BY created_at DESC';
    const [rows] = await promisePool.execute(sql);
    return rows;
  }

  // ✅ NOUVEAU CODE Prisma
  static async findAll() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ❌ ANCIEN CODE MySQL
  static async getPlanLimitsOld(plan) {
    const Plan = require('./Plan');
    const limits = await Plan.getLimits(plan);
    return limits;
  }

  // ✅ NOUVEAU CODE Prisma
  static async getPlanLimits(plan) {
    const planData = await prisma.plan.findUnique({
      where: { name: plan }
    });

    if (!planData) {
      // Fallback sur valeurs par défaut
      return this.getDefaultLimits(plan);
    }

    return {
      max_instances: planData.maxInstances,
      max_workflows: planData.maxWorkflows,
      max_storage_gb: planData.maxStorageGb,
      max_executions_per_month: planData.maxExecutionsPerMonth
    };
  }

  static getDefaultLimits(plan) {
    const limits = {
      free: { max_instances: 1, max_workflows: 10, max_storage_gb: 1, max_executions_per_month: 1000 },
      pro: { max_instances: 5, max_workflows: 100, max_storage_gb: 10, max_executions_per_month: 50000 },
      business: { max_instances: 20, max_workflows: -1, max_storage_gb: 50, max_executions_per_month: 500000 },
      corporation: { max_instances: -1, max_workflows: -1, max_storage_gb: -1, max_executions_per_month: -1 }
    };
    return limits[plan] || limits.free;
  }
}

// ============================================
// INSTANCE SERVICE
// ============================================

class InstanceService {
  // ❌ ANCIEN CODE MySQL
  static async createOld({ userId, name, status = 'creating', deploymentType = 'cloud' }) {
    const uuid = uuidv4().substring(0, 8);
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
  }

  // ✅ NOUVEAU CODE Prisma
  static async create({ userId, name, status = 'creating', deploymentType = 'cloud' }) {
    const uuid = uuidv4().substring(0, 8);
    const subdomain = `${uuid}.logicai.fr`;

    const instance = await prisma.instance.create({
      data: {
        userId,
        name,
        uuid,
        subdomain,
        status,
        deploymentType
      }
    });

    return {
      id: instance.id,
      uuid: instance.uuid,
      subdomain: instance.subdomain,
      name: instance.name,
      status: instance.status,
      deployment_type: instance.deploymentType
    };
  }

  // ❌ ANCIEN CODE MySQL
  static async findByUserIdOld(userId) {
    const sql = 'SELECT * FROM instances WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await promisePool.execute(sql, [userId]);
    return rows;
  }

  // ✅ NOUVEAU CODE Prisma
  static async findByUserId(userId) {
    return await prisma.instance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ❌ ANCIEN CODE MySQL
  static async countCloudInstancesOld(userId) {
    const sql = 'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND deployment_type = "cloud" AND status != "deleted"';
    const [rows] = await promisePool.execute(sql, [userId]);
    return rows[0].count;
  }

  // ✅ NOUVEAU CODE Prisma
  static async countCloudInstances(userId) {
    return await prisma.instance.count({
      where: {
        userId,
        deploymentType: 'cloud',
        status: { not: 'deleted' }
      }
    });
  }

  // ❌ ANCIEN CODE MySQL (avec jointure)
  static async findByUuidWithMembersOld(uuid) {
    const sql = `
      SELECT i.*, u.email as owner_email
      FROM instances i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.uuid = ?
    `;
    const [rows] = await promisePool.execute(sql, [uuid]);
    return rows[0] || null;
  }

  // ✅ NOUVEAU CODE Prisma (avec include)
  static async findByUuidWithMembers(uuid) {
    return await prisma.instance.findUnique({
      where: { uuid },
      include: {
        user: {
          select: {
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                email: true,
            firstName: true,
            lastName: true
              }
            }
          }
        }
      }
    });
  }

  // ❌ ANCIEN CODE MySQL (mise à jour multiple)
  static async updatePortAndPasswordOld(id, port, tempPassword) {
    const sql = 'UPDATE instances SET port = ?, temp_password = ? WHERE id = ?';
    await promisePool.execute(sql, [port, tempPassword, id]);
    return true;
  }

  // ✅ NOUVEAU CODE Prisma (mise à jour multiple)
  static async updatePortAndPassword(id, port, tempPassword) {
    await prisma.instance.update({
      where: { id },
      data: {
        port,
        tempPassword
      }
    });
    return true;
  }

  // ✅ NOUVEAU CODE Prisma (transaction)
  static async createWithDefaults(userId) {
    const { v4: uuidv4 } = require('uuid');

    return await prisma.$transaction(async (tx) => {
      // Créer l'instance
      const instance = await tx.instance.create({
        data: {
          userId,
          name: `instance-${Date.now()}`,
          uuid: uuidv4().substring(0, 8),
          subdomain: `${uuidv4().substring(0, 8)}.logicai.fr`,
          status: 'creating',
          deploymentType: 'cloud'
        }
      });

      // Créer les membres par défaut
      await tx.instanceMember.create({
        data: {
          instanceId: instance.id,
          userId: userId,
          email: '', // Sera rempli
          name: 'Owner',
          role: 'owner',
          invitationStatus: 'accepted'
        }
      });

      return instance;
    });
  }
}

// ============================================
// INSTANCE MEMBER SERVICE
// ============================================

class InstanceMemberService {
  // ❌ ANCIEN CODE MySQL
  static async findAcceptedInstancesByUserIdOld(userId) {
    const sql = `
      SELECT i.*, im.role as member_role
      FROM instances i
      JOIN instance_members im ON im.instance_id = i.id
      WHERE im.user_id = ? AND im.invitation_status = 'accepted'
      ORDER BY i.created_at DESC
    `;
    const [rows] = await promisePool.execute(sql, [userId]);
    return rows;
  }

  // ✅ NOUVEAU CODE Prisma
  static async findAcceptedInstancesByUserId(userId) {
    return await prisma.instanceMember.findMany({
      where: {
        userId,
        invitationStatus: 'accepted'
      },
      include: {
        instance: true
      },
      orderBy: {
        instance: {
          createdAt: 'desc'
        }
      }
    });
  }

  // ✅ NOUVEAU CODE Prisma (pagination)
  static async findByInstanceIdPaginated(instanceId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.instanceMember.findMany({
        where: { instanceId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }
      }),
      prisma.instanceMember.count({
        where: { instanceId }
      })
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

// ============================================
// ADVANCED QUERIES
// ============================================

class AdvancedQueries {
  // Recherche d'instances avec filtres multiples
  static async findInstancesWithFilters(filters) {
    const { userId, status, deploymentType, search } = filters;

    const where = {
      ...(userId && { userId }),
      ...(status && { status }),
      ...(deploymentType && { deploymentType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { subdomain: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    return await prisma.instance.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Agrégation pour les stats admin
  static async getAdminStats() {
    const [
      totalUsers,
      totalInstances,
      instancesByStatus,
      instancesByType,
      instancesByPlan
    ] = await Promise.all([
      prisma.user.count(),
      prisma.instance.count(),
      prisma.instance.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.instance.groupBy({
        by: ['deploymentType'],
        _count: true
      }),
      // Instances regroupées par plan de l'utilisateur
      prisma.$queryRaw`
        SELECT u.plan, COUNT(i.id) as count
        FROM users u
        LEFT JOIN instances i ON u.id = i.user_id
        GROUP BY u.plan
      `
    ]);

    return {
      totalUsers,
      totalInstances,
      instancesByStatus,
      instancesByType,
      instancesByPlan
    };
  }

  // Instances avec leurs membres et stats
  static async getInstanceWithStats(uuid) {
    return await prisma.instance.findUnique({
      where: { uuid },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            plan: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

class BatchOperations {
  // Mise à jour en masse du statut des instances
  static async updateStatusBatch(instanceIds, status) {
    return await prisma.instance.updateMany({
      where: {
        id: { in: instanceIds }
      },
      data: { status }
    });
  }

  // Création en masse de membres
  static async inviteMembersBatch(instanceId, emails) {
    const { v4: uuidv4 } = require('uuid');

    return await prisma.instanceMember.createMany({
      data: emails.map(email => ({
        instanceId,
        email,
        role: 'viewer',
        invitationToken: uuidv4(),
        invitationStatus: 'pending'
      })),
      skipDuplicates: true
    });
  }

  // Suppression en masse (soft delete)
  static async softDeleteBatch(instanceIds) {
    return await prisma.instance.updateMany({
      where: {
        id: { in: instanceIds }
      },
      data: {
        status: 'deleted'
      }
    });
  }
}

module.exports = {
  UserService,
  InstanceService,
  InstanceMemberService,
  AdvancedQueries,
  BatchOperations
};

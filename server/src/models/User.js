const prisma = require('../config/database');

function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    password: u.password,
    first_name: u.firstName,
    last_name: u.lastName,
    firstName: u.firstName,
    lastName: u.lastName,
    plan: u.plan,
    role: u.role,
    has_beta_access: u.hasBetaAccess,
    hasBetaAccess: u.hasBetaAccess,
    beta_access_id: u.betaAccessId,
    betaAccessId: u.betaAccessId,
    created_at: u.createdAt,
    createdAt: u.createdAt,
    updated_at: u.updatedAt,
    updatedAt: u.updatedAt,
  };
}

const DEFAULT_LIMITS = {
  free:        { max_instances: 1,  max_workflows: 10,  max_storage_gb: 1,  max_executions_per_month: 1000 },
  pro:         { max_instances: 5,  max_workflows: 100, max_storage_gb: 10, max_executions_per_month: 50000 },
  business:    { max_instances: 20, max_workflows: -1,  max_storage_gb: 50, max_executions_per_month: 500000 },
  corporation: { max_instances: -1, max_workflows: -1,  max_storage_gb: -1, max_executions_per_month: -1 },
};

class User {
  static async create({ email, password, firstName, lastName, plan = 'free', role = 'user' }) {
    const user = await prisma.user.create({
      data: { email, password, firstName, lastName, plan, role },
    });
    return user.id;
  }

  static async findByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    return mapUser(user);
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    return mapUser(user);
  }

  static async updatePlan(id, plan) {
    await prisma.user.update({ where: { id: Number(id) }, data: { plan } });
    return true;
  }

  static async updateRole(id, role) {
    await prisma.user.update({ where: { id: Number(id) }, data: { role } });
    return true;
  }

  static async findAll() {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(mapUser);
  }

  static hasRole(userRole, requiredRole) {
    const hierarchy = { user: 0, mod: 1, admin: 2 };
    return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
  }

  static async getPlanLimits(plan) {
    try {
      const Plan = require('./Plan');
      return await Plan.getLimits(plan);
    } catch {
      return DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.free;
    }
  }

  static getPlanLimitsSync(plan) {
    return DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.free;
  }

  static isValidPlan(plan) {
    return ['free', 'pro', 'business', 'corporation'].includes(plan);
  }
}

module.exports = User;

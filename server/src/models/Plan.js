const prisma = require('../config/database');

function mapPlan(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    display_name: p.displayName,
    displayName: p.displayName,
    description: p.description,
    price_monthly: Number(p.priceMonthly),
    priceMonthly: Number(p.priceMonthly),
    price_yearly: Number(p.priceYearly),
    priceYearly: Number(p.priceYearly),
    max_instances: p.maxInstances,
    maxInstances: p.maxInstances,
    max_workflows: p.maxWorkflows,
    maxWorkflows: p.maxWorkflows,
    max_storage_gb: p.maxStorageGb,
    maxStorageGb: p.maxStorageGb,
    max_executions_per_month: p.maxExecutionsPerMonth,
    maxExecutionsPerMonth: p.maxExecutionsPerMonth,
    features: p.features,
    is_active: p.isActive,
    isActive: p.isActive,
    created_at: p.createdAt,
    createdAt: p.createdAt,
    updated_at: p.updatedAt,
    updatedAt: p.updatedAt,
  };
}

const SNAKE_TO_CAMEL = {
  display_name: 'displayName',
  description: 'description',
  price_monthly: 'priceMonthly',
  price_yearly: 'priceYearly',
  max_instances: 'maxInstances',
  max_workflows: 'maxWorkflows',
  max_storage_gb: 'maxStorageGb',
  max_executions_per_month: 'maxExecutionsPerMonth',
  features: 'features',
  is_active: 'isActive',
};

class Plan {
  static async create({
    name, display_name, description,
    price_monthly, price_yearly,
    max_instances, max_workflows, max_storage_gb, max_executions_per_month,
    features, is_active = true,
  }) {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        displayName: display_name,
        description,
        priceMonthly: price_monthly,
        priceYearly: price_yearly,
        maxInstances: max_instances,
        maxWorkflows: max_workflows,
        maxStorageGb: max_storage_gb,
        maxExecutionsPerMonth: max_executions_per_month,
        features: features ?? undefined,
        isActive: is_active,
      },
    });
    return plan.id;
  }

  static async findByName(name) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { name } });
    return mapPlan(plan);
  }

  static async findById(id) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: Number(id) } });
    return mapPlan(plan);
  }

  static async findAllActive() {
    const rows = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
    return rows.map(mapPlan);
  }

  static async findAll() {
    const rows = await prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
    return rows.map(mapPlan);
  }

  static async update(id, updates) {
    const data = {};
    for (const [k, v] of Object.entries(updates)) {
      if (SNAKE_TO_CAMEL[k]) data[SNAKE_TO_CAMEL[k]] = v;
    }
    if (Object.keys(data).length === 0) return false;
    await prisma.subscriptionPlan.update({ where: { id: Number(id) }, data });
    return true;
  }

  static async toggleActive(id, isActive) {
    await prisma.subscriptionPlan.update({ where: { id: Number(id) }, data: { isActive } });
    return true;
  }

  static async delete(id) {
    await prisma.subscriptionPlan.update({ where: { id: Number(id) }, data: { isActive: false } });
    return true;
  }

  static async getLimits(planName) {
    const plan = await this.findByName(planName);
    if (!plan) {
      return { max_instances: 1, max_workflows: 10, max_storage_gb: 1, max_executions_per_month: 1000 };
    }
    return {
      max_instances: plan.max_instances,
      max_workflows: plan.max_workflows,
      max_storage_gb: plan.max_storage_gb,
      max_executions_per_month: plan.max_executions_per_month,
    };
  }

  static async comparePlans(planName1, planName2) {
    const [plan1, plan2] = await Promise.all([this.findByName(planName1), this.findByName(planName2)]);
    return {
      plan1,
      plan2,
      comparison: {
        price_difference: plan2 ? plan2.price_monthly - plan1.price_monthly : 0,
        instance_difference: plan2 ? plan2.max_instances - plan1.max_instances : 0,
        workflow_difference: plan2 ? plan2.max_workflows - plan1.max_workflows : 0,
      },
    };
  }
}

module.exports = Plan;

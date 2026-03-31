const prisma = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function mapInstance(inst) {
  if (!inst) return null;
  return {
    id: inst.id,
    user_id: inst.userId,
    userId: inst.userId,
    name: inst.name,
    uuid: inst.uuid,
    subdomain: inst.subdomain,
    port: inst.port,
    status: inst.status,
    deployment_type: inst.deploymentType,
    deploymentType: inst.deploymentType,
    container_id: inst.containerId,
    containerId: inst.containerId,
    temp_password: inst.tempPassword,
    tempPassword: inst.tempPassword,
    password_set: inst.passwordSet,
    passwordSet: inst.passwordSet,
    instance_email: inst.instanceEmail,
    instanceEmail: inst.instanceEmail,
    is_shared: inst.isShared,
    isShared: inst.isShared,
    public_url: inst.publicUrl,
    publicUrl: inst.publicUrl,
    url: inst.publicUrl || (inst.port ? `http://localhost:${inst.port}` : null),
    created_at: inst.createdAt,
    createdAt: inst.createdAt,
    updated_at: inst.updatedAt,
    updatedAt: inst.updatedAt,
  };
}

class Instance {
  static async create({ userId, name, status = 'creating', deploymentType = 'cloud' }) {
    const uuid = uuidv4().substring(0, 8);
    const subdomain = `${uuid}.logicai.fr`;
    const inst = await prisma.instance.create({
      data: { userId: Number(userId), name, uuid, subdomain, status, deploymentType },
    });
    return mapInstance(inst);
  }

  static async findByUserId(userId) {
    const rows = await prisma.instance.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapInstance);
  }

  static async findAll() {
    const rows = await prisma.instance.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mapInstance);
  }

  static async findByUuid(uuid) {
    const inst = await prisma.instance.findUnique({ where: { uuid } });
    return mapInstance(inst);
  }

  static async findById(id) {
    const inst = await prisma.instance.findUnique({ where: { id: Number(id) } });
    return mapInstance(inst);
  }

  static async updateStatus(id, status) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { status } });
    return true;
  }

  static async updatePort(id, port) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { port } });
    return true;
  }

  static async updateContainerId(id, containerId) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { containerId } });
    return true;
  }

  static async delete(id) {
    await prisma.instance.delete({ where: { id: Number(id) } });
    return true;
  }

  static async countByUserId(userId, includeLocal = false) {
    return prisma.instance.count({
      where: {
        userId: Number(userId),
        status: { not: 'deleted' },
        ...(includeLocal ? {} : { deploymentType: 'cloud' }),
      },
    });
  }

  static async countCloudInstances(userId) {
    return Instance.countByUserId(userId, false);
  }

  static async updatePublicUrl(id, publicUrl) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { publicUrl } });
    return true;
  }

  static async updateTempPassword(id, tempPassword) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { tempPassword } });
    return true;
  }

  static async updateInstanceEmail(id, email) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { instanceEmail: email } });
    return true;
  }

  static async markPasswordSet(id) {
    await prisma.instance.update({
      where: { id: Number(id) },
      data: { passwordSet: true, tempPassword: null },
    });
    return true;
  }

  static async isPasswordSet(id) {
    const inst = await prisma.instance.findUnique({
      where: { id: Number(id) },
      select: { passwordSet: true },
    });
    return inst?.passwordSet ?? false;
  }

  static async updateInstancePassword(id, passwordHash) {
    await prisma.instance.update({ where: { id: Number(id) }, data: { tempPassword: passwordHash } });
    return true;
  }

  static async getInstancePassword(id) {
    const inst = await prisma.instance.findUnique({
      where: { id: Number(id) },
      select: { tempPassword: true },
    });
    return inst?.tempPassword ?? null;
  }
}

module.exports = Instance;

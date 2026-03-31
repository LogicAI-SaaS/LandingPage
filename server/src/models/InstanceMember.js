const prisma = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function mapMember(m) {
  if (!m) return null;
  return {
    id: m.id,
    instance_id: m.instanceId,
    instanceId: m.instanceId,
    user_id: m.userId,
    userId: m.userId,
    email: m.email,
    name: m.name,
    role: m.role,
    temp_password: m.tempPassword,
    tempPassword: m.tempPassword,
    password_set: m.passwordSet,
    passwordSet: m.passwordSet,
    invitation_token: m.invitationToken,
    invitationToken: m.invitationToken,
    invitation_status: m.invitationStatus,
    invitationStatus: m.invitationStatus,
    created_at: m.createdAt,
    createdAt: m.createdAt,
    updated_at: m.updatedAt,
    updatedAt: m.updatedAt,
  };
}

class InstanceMember {
  static async create({ instanceId, userId, email, name, role = 'viewer' }) {
    const invitationToken = uuidv4();
    const member = await prisma.instanceMember.create({
      data: {
        instanceId: Number(instanceId),
        userId: userId ? Number(userId) : null,
        email,
        name,
        role,
        invitationToken,
      },
    });
    return mapMember(member);
  }

  static async findByInstanceId(instanceId) {
    const rows = await prisma.instanceMember.findMany({
      where: { instanceId: Number(instanceId) },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapMember);
  }

  static async findById(id) {
    const m = await prisma.instanceMember.findUnique({ where: { id: Number(id) } });
    return mapMember(m);
  }

  static async findByInvitationToken(token) {
    const m = await prisma.instanceMember.findUnique({ where: { invitationToken: token } });
    return mapMember(m);
  }

  static async updateRole(id, role) {
    await prisma.instanceMember.update({ where: { id: Number(id) }, data: { role } });
    return true;
  }

  static async updateInvitationStatus(id, status) {
    await prisma.instanceMember.update({ where: { id: Number(id) }, data: { invitationStatus: status } });
    return true;
  }

  static async acceptInvitation(memberId, userId) {
    await prisma.instanceMember.update({
      where: { id: Number(memberId) },
      data: { userId: Number(userId), invitationStatus: 'accepted' },
    });
    return true;
  }

  static async setTempPassword(id, tempPassword) {
    await prisma.instanceMember.update({ where: { id: Number(id) }, data: { tempPassword } });
    return true;
  }

  static async markPasswordSet(id) {
    await prisma.instanceMember.update({
      where: { id: Number(id) },
      data: { passwordSet: true, tempPassword: null },
    });
    return true;
  }

  static async delete(id) {
    await prisma.instanceMember.delete({ where: { id: Number(id) } });
    return true;
  }

  static async findAcceptedInstancesByUserId(userId) {
    const members = await prisma.instanceMember.findMany({
      where: { userId: Number(userId), invitationStatus: 'accepted' },
      include: { instance: true },
      orderBy: { instance: { createdAt: 'desc' } },
    });
    return members.map((m) => {
      const inst = m.instance;
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
        public_url: inst.publicUrl,
        publicUrl: inst.publicUrl,
        created_at: inst.createdAt,
        createdAt: inst.createdAt,
        updated_at: inst.updatedAt,
        updatedAt: inst.updatedAt,
        member_role: m.role,
      };
    });
  }

  static async findPendingInvitationsByEmail(email) {
    const members = await prisma.instanceMember.findMany({
      where: { email, invitationStatus: 'pending', userId: null },
      include: { instance: { include: { user: true } } },
    });
    return members.map((m) => ({
      ...mapMember(m),
      instance_name: m.instance.name,
      instance_uuid: m.instance.uuid,
      owner_email: m.instance.user.email,
    }));
  }
}

module.exports = InstanceMember;

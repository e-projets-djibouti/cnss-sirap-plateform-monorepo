import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const OWNER_EMAIL = 'admin@cnss.dj';
const OWNER_PASSWORD = 'Admin@1234';

const DEFAULT_PERMISSIONS = [
  { action: 'users:read',         description: 'Lire les utilisateurs' },
  { action: 'users:create',       description: 'Créer des utilisateurs' },
  { action: 'users:update',       description: 'Modifier des utilisateurs' },
  { action: 'users:delete',       description: 'Supprimer des utilisateurs' },
  { action: 'users:change-role',  description: 'Changer le rôle d\'un utilisateur' },
  { action: 'roles:read',         description: 'Lire les rôles' },
  { action: 'roles:manage',       description: 'Gérer les rôles et leurs permissions' },
  { action: 'permissions:read',   description: 'Lire les permissions disponibles' },
  { action: 'permissions:manage', description: 'Gérer les permissions' },
];

const ADMIN_PERMISSIONS = [
  'users:read', 'users:create', 'users:update',
  'roles:read', 'permissions:read',
];

async function main() {
  console.log('🌱 Seeding database...');

  // ── Permissions ────────────────────────────────────────────────────────────
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ ${DEFAULT_PERMISSIONS.length} permissions upserted`);

  // ── Rôles ─────────────────────────────────────────────────────────────────
  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: { name: 'OWNER', description: 'Super administrateur — accès total', level: 100, isSystem: true },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrateur', level: 50, isSystem: true },
  });

  await prisma.role.upsert({
    where: { name: 'AGENT' },
    update: {},
    create: { name: 'AGENT', description: 'Agent de base', level: 10, isSystem: true },
  });

  // ── Assigner permissions à ADMIN ──────────────────────────────────────────
  const adminPerms = await prisma.permission.findMany({
    where: { action: { in: ADMIN_PERMISSIONS } },
  });
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
  console.log('✅ 3 roles created (OWNER level=100, ADMIN level=50, AGENT level=10)');

  // ── Utilisateur OWNER initial ─────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 12);
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      email: OWNER_EMAIL,
      password: hashedPassword,
      roleId: ownerRole.id,
      isActive: true,
      profile: { create: { firstName: 'Super', lastName: 'Admin' } },
    },
    include: { role: true },
  });

  console.log('✅ Owner:', owner.email, `(role: ${owner.role.name})`);
  console.log('🔑 Password:', OWNER_PASSWORD);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

import { db } from '@/lib/db'
import { DEFAULT_PERMISSIONS } from '@/lib/permissions'

async function main() {
  for (const [key, label] of DEFAULT_PERMISSIONS) {
    const permission = await db.permission.upsert({
      where: { key },
      create: { key, label },
      update: { label },
    })
    for (const role of ['ADMIN', 'SALES_MANAGER', 'OPERATOR']) {
      const allowed = role === 'ADMIN' || (role === 'SALES_MANAGER' && !['settings.write'].includes(key)) || (role === 'OPERATOR' && ['products.read', 'products.write', 'inventory.write'].includes(key))
      if (allowed) await db.rolePermission.upsert({ where: { role_permissionId: { role, permissionId: permission.id } }, create: { role, permissionId: permission.id }, update: {} })
    }
  }
  console.log('Permissions initialized from configuration.')
}

main().catch(err => { console.error(err); process.exit(1) }).finally(() => db.$disconnect())

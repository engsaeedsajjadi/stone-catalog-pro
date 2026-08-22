import { db } from "@/lib/db";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";

async function main() {
  for (const [key, label] of DEFAULT_PERMISSIONS) {
    const permission = await db.permission.upsert({
      where: {
        key,
      },
      create: {
        key,
        label,
      },
      update: {
        label,
      },
    });

    for (const role of ["ADMIN", "SALES_MANAGER", "OPERATOR"] as const) {
      const allowed =
        role === "ADMIN" ||
        (role === "SALES_MANAGER" &&
          key !== "settings.write") ||
        (role === "OPERATOR" &&
          [
            "products.read",
            "products.write",
            "inventory.write",
          ].includes(key));

      if (!allowed) {
        continue;
      }

      await db.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: permission.id,
          },
        },
        create: {
          role,
          permissionId: permission.id,
        },
        update: {},
      });
    }
  }

  console.log("Permissions initialized from configuration.");
}

main()
  .catch((error) => {
    console.error("Permission bootstrap failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
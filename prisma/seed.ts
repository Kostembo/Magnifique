import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: создаём первого менеджера...");

  const existing = await prisma.employee.findUnique({
    where: { phone: "79000000000" },
  });

  if (existing) {
    console.log("Менеджер уже существует, пропускаем.");
    return;
  }

  const password_hash = await bcrypt.hash("admin123", 12);

  const manager = await prisma.employee.create({
    data: {
      full_name: "Администратор",
      phone: "79000000000",
      password_hash,
      role: "manager",
      tier: "core",
      is_active: true,
    },
  });

  console.log(`✓ Менеджер создан:`);
  console.log(`  ID:       ${manager.id}`);
  console.log(`  Телефон:  +7 900 000-00-00`);
  console.log(`  Пароль:   admin123`);
  console.log(`  ⚠️  Смените пароль после первого входа!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

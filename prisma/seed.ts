import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: создаём служебные аккаунты...");

  const accounts = [
    { full_name: "Администратор",   phone: "79000000000", password: "admin000", role: "admin"  as const, tier: "core" as const },
    { full_name: "Владелец 1",      phone: "79001111111", password: "111111",   role: "owner"  as const, tier: "core" as const },
    { full_name: "Владелец 2",      phone: "79002222222", password: "222222",   role: "owner"  as const, tier: "core" as const },
  ];

  for (const acc of accounts) {
    const password_hash = await bcrypt.hash(acc.password, 12);
    const emp = await prisma.employee.upsert({
      where: { phone: acc.phone },
      update: { role: acc.role, password_hash, full_name: acc.full_name, is_active: true },
      create: {
        full_name: acc.full_name,
        phone: acc.phone,
        password_hash,
        role: acc.role,
        tier: acc.tier,
        is_active: true,
      },
    });
    console.log(`✓ ${acc.role.padEnd(7)} ${emp.full_name}  +7 ${acc.phone.slice(1, 4)} ${acc.phone.slice(4, 7)}-${acc.phone.slice(7, 9)}-${acc.phone.slice(9)}`);
  }

  console.log("\n⚠️  Смените пароли после первого входа!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

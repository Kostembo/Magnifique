import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: создаём служебные аккаунты...");

  const accounts = [
    { full_name: "Администратор",  phone: "79000000000", password: "000000", role: "admin"      as const, tier: "core"  as const },
    { full_name: "Владелец 1",     phone: "79001111111", password: "000000", role: "owner"      as const, tier: "core"  as const },
    { full_name: "Владелец 2",     phone: "79002222222", password: "000000", role: "owner"      as const, tier: "core"  as const },
    { full_name: "Бухгалтер",      phone: "79003000001", password: "000000", role: "accountant" as const, tier: "core"  as const },
    { full_name: "Шеф-повар",      phone: "79003000002", password: "000000", role: "cook"       as const, tier: "core"  as const },
    { full_name: "Повар 1",        phone: "79003001001", password: "000000", role: "cook"       as const, tier: "regular" as const },
    { full_name: "Повар 2",        phone: "79003001002", password: "000000", role: "cook"       as const, tier: "regular" as const },
    { full_name: "Повар 3",        phone: "79003001003", password: "000000", role: "cook"       as const, tier: "regular" as const },
    { full_name: "Повар 4",        phone: "79003001004", password: "000000", role: "cook"       as const, tier: "regular" as const },
    { full_name: "Повар 5",        phone: "79003001005", password: "000000", role: "cook"       as const, tier: "regular" as const },
    { full_name: "Официант 1",     phone: "79003002001", password: "000000", role: "waiter"     as const, tier: "regular" as const },
    { full_name: "Официант 2",     phone: "79003002002", password: "000000", role: "waiter"     as const, tier: "regular" as const },
    { full_name: "Официант 3",     phone: "79003002003", password: "000000", role: "waiter"     as const, tier: "regular" as const },
    { full_name: "Официант 4",     phone: "79003002004", password: "000000", role: "waiter"     as const, tier: "regular" as const },
    { full_name: "Официант 5",     phone: "79003002005", password: "000000", role: "waiter"     as const, tier: "regular" as const },
    { full_name: "Складской",      phone: "79003003001", password: "000000", role: "warehouse"  as const, tier: "regular" as const },
  ];

  for (const acc of accounts) {
    const password_hash = await bcrypt.hash(acc.password, 12);
    const emp = await prisma.employee.upsert({
      where: { phone: acc.phone },
      update: { role: acc.role, password_hash, full_name: acc.full_name },
      create: {
        full_name: acc.full_name,
        phone: acc.phone,
        password_hash,
        role: acc.role,
        tier: acc.tier,
      },
    });
    console.log(`✓ ${acc.role.padEnd(7)} ${emp.full_name}  +7 ${acc.phone.slice(1, 4)} ${acc.phone.slice(4, 7)}-${acc.phone.slice(7, 9)}-${acc.phone.slice(9)}`);
  }

  console.log("\n⚠️  Смените пароли после первого входа!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

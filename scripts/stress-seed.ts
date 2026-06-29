/**
 * stress-seed.ts — создаёт 150 тестовых сотрудников для стресс-теста.
 * Запуск: npm run stress:seed
 * Удаление: npm run stress:cleanup (scripts/stress-cleanup.ts)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const STRESS_PHONE_PREFIX = "7900900"; // 79009000001–79009000150
export const STRESS_PASSWORD = "Stress2024";
export const STRESS_TOTAL = 150;

async function main() {
  console.log(`Stress seed: создаём ${STRESS_TOTAL} тестовых сотрудников...`);

  // Один хеш на всех — bcrypt хранит соль в хеше, compare работает корректно
  const password_hash = await bcrypt.hash(STRESS_PASSWORD, 4);

  const accounts = Array.from({ length: STRESS_TOTAL }, (_, i) => {
    const n = i + 1;
    const pad = String(n).padStart(3, "0");
    const phone = `7900900${String(n).padStart(4, "0")}`;
    const role = n <= 100 ? ("waiter" as const) : ("cook" as const);
    return { full_name: `Стресс-${pad}`, phone, role };
  });

  let created = 0;
  let skipped = 0;

  // Пакетами по 20 чтобы не перегружать connection pool
  for (let i = 0; i < accounts.length; i += 20) {
    const batch = accounts.slice(i, i + 20);
    await Promise.all(
      batch.map(async (acc) => {
        const result = await prisma.employee.upsert({
          where: { phone: acc.phone },
          update: { full_name: acc.full_name, role: acc.role, password_hash },
          create: {
            full_name: acc.full_name,
            phone: acc.phone,
            password_hash,
            role: acc.role,
            tier: "regular",
          },
        });
        if (result) created++;
      })
    );
    process.stdout.write(`\r  ${Math.min(i + 20, STRESS_TOTAL)}/${STRESS_TOTAL} аккаунтов...`);
  }

  console.log(`\n✓ Готово: ${created} создано/обновлено, ${skipped} пропущено`);
  console.log(`  Телефоны: 79009000001 – 79009000${STRESS_TOTAL}`);
  console.log(`  Пароль:   ${STRESS_PASSWORD}`);
}

if (require.main === module) {
  main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

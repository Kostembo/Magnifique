/**
 * stress-setup.ts — создаёт тестовое мероприятие + назначает всех 150 стресс-юзеров.
 * Записывает event_id в scripts/stress-event.json для k6.
 * Запуск: npm run stress:setup
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { STRESS_PHONE_PREFIX, STRESS_TOTAL } from "./stress-seed";

const prisma = new PrismaClient();
const OUT_FILE = path.join(__dirname, "stress-event.json");
const EVENT_ID = "stress-test-event-000000000000";

async function main() {
  console.log("Stress setup: создаём тестовое мероприятие...");

  const manager = await prisma.employee.findFirst({
    where: { role: { in: ["manager", "owner", "admin"] } },
    select: { id: true },
  });
  if (!manager) throw new Error("Нет ни одного менеджера/владельца в БД. Запустите npm run db:seed");

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 1);

  const event = await prisma.event.upsert({
    where: { id: EVENT_ID },
    update: { title: "[СТРЕСС-ТЕСТ] Нагрузочное мероприятие" },
    create: {
      id: EVENT_ID,
      title: "[СТРЕСС-ТЕСТ] Нагрузочное мероприятие",
      client: "Стресс-тест",
      location: "Локальный стенд",
      starts_at: eventDate,
      created_by: manager.id,
    },
  });
  console.log(`  Мероприятие: ${event.id}`);

  // Создаём 2 позиции: 100 официантов + 50 поваров
  // deleteMany + createMany чтобы не дублировать при повторном запуске
  await prisma.eventPosition.deleteMany({ where: { event_id: EVENT_ID } });
  const [waiterPos, cookPos] = await Promise.all([
    prisma.eventPosition.create({
      data: { event_id: EVENT_ID, role: "waiter", needed_count: 100 },
    }),
    prisma.eventPosition.create({
      data: { event_id: EVENT_ID, role: "cook", needed_count: 50 },
    }),
  ]);
  console.log(`  Позиции: waiter id=${waiterPos.id}, cook id=${cookPos.id}`);

  // Находим всех стресс-сотрудников
  const phones = Array.from({ length: STRESS_TOTAL }, (_, i) =>
    `${STRESS_PHONE_PREFIX}${String(i + 1).padStart(4, "0")}`
  );
  const employees = await prisma.employee.findMany({
    where: { phone: { in: phones } },
    select: { id: true, role: true },
  });
  if (employees.length === 0) {
    throw new Error("Стресс-аккаунты не найдены. Запустите npm run stress:seed");
  }
  console.log(`  Найдено стресс-сотрудников: ${employees.length}`);

  // Назначаем: первые 100 (waiter) → waiterPos, остальные (cook) → cookPos
  const waiters = employees.filter((e) => e.role === "waiter");
  const cooks   = employees.filter((e) => e.role === "cook");

  const toCreate = [
    ...waiters.map((e) => ({ event_id: EVENT_ID, position_id: waiterPos.id, employee_id: e.id, status: "confirmed" as const })),
    ...cooks.map((e)   => ({ event_id: EVENT_ID, position_id: cookPos.id,   employee_id: e.id, status: "confirmed" as const })),
  ];

  // createMany пакетами (уже удалили все позиции, дублей нет)
  const BATCH = 50;
  let assigned = 0;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH);
    await prisma.assignment.createMany({ data: batch, skipDuplicates: true });
    assigned += batch.length;
    process.stdout.write(`\r  Назначено: ${assigned}/${toCreate.length}...`);
  }

  console.log(`\n✓ Назначено: ${assigned} сотрудников`);

  const output = { event_id: EVENT_ID, employee_count: employees.length };
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  console.log(`  Данные сохранены в ${OUT_FILE}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

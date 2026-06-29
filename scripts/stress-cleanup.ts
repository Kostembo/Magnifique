/**
 * stress-cleanup.ts — удаляет всех тестовых сотрудников и связанные данные.
 * Запуск: npm run stress:cleanup
 */
import { PrismaClient } from "@prisma/client";
import { STRESS_PHONE_PREFIX, STRESS_TOTAL } from "./stress-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Stress cleanup: удаляем тестовые данные...");

  const phones = Array.from({ length: STRESS_TOTAL }, (_, i) =>
    `${STRESS_PHONE_PREFIX}${String(i + 1).padStart(4, "0")}`
  );

  const employees = await prisma.employee.findMany({
    where: { phone: { in: phones } },
    select: { id: true, full_name: true },
  });

  if (employees.length === 0) {
    console.log("Нет тестовых сотрудников для удаления.");
    return;
  }

  const ids = employees.map((e) => e.id);

  // Удаляем в правильном порядке (FK constraints)
  const [timeEntries, assignments, comments] = await Promise.all([
    prisma.timeEntry.deleteMany({ where: { employee_id: { in: ids } } }),
    prisma.assignment.deleteMany({ where: { employee_id: { in: ids } } }),
    prisma.comment.deleteMany({ where: { author_id: { in: ids } } }),
  ]);

  // Удаляем тестовое мероприятие и его данные
  const EVENT_ID = "stress-test-event-000000000000";
  const [eventTimeEntries, eventAssignments] = await Promise.all([
    prisma.timeEntry.deleteMany({ where: { event_id: EVENT_ID } }),
    prisma.assignment.deleteMany({ where: { event_id: EVENT_ID } }),
  ]);
  await prisma.event.deleteMany({ where: { id: EVENT_ID } });

  const deleted = await prisma.employee.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`✓ Удалено:`);
  console.log(`  Сотрудников:  ${deleted.count}`);
  console.log(`  Назначений:   ${assignments.count + eventAssignments.count}`);
  console.log(`  Записей табеля: ${timeEntries.count + eventTimeEntries.count}`);
  console.log(`  Комментариев: ${comments.count}`);
  console.log(`  Тестовое мероприятие: удалено`);
}

if (require.main === module) {
  main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

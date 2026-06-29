/**
 * demo-cleanup.ts — удаляет всех демо-сотрудников и мероприятия demo-event-*.
 * Запуск: npm run demo:cleanup
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Demo cleanup...");

  const employees = await prisma.employee.findMany({
    where: { phone: { startsWith: "79161" } },
    select: { id: true },
  });
  const ids = employees.map(e => e.id);

  const eventIds = (await prisma.event.findMany({
    where: { id: { startsWith: "demo-event-" } },
    select: { id: true },
  })).map(e => e.id);

  await Promise.all([
    prisma.timeEntry.deleteMany({ where: { employee_id: { in: ids } } }),
    prisma.timeEntry.deleteMany({ where: { event_id: { in: eventIds } } }),
    prisma.assignment.deleteMany({ where: { employee_id: { in: ids } } }),
  ]);

  await prisma.eventPosition.deleteMany({ where: { event_id: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { startsWith: "demo-event-" } } });
  const del = await prisma.employee.deleteMany({ where: { id: { in: ids } } });

  console.log(`✓ Удалено: ${del.count} сотрудников, ${eventIds.length} мероприятий`);
}

if (require.main === module) {
  main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

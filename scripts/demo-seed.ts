/**
 * demo-seed.ts — реалистичные тестовые данные июль 2026:
 *   100 сотрудников со ставками, 60 мероприятий (done),
 *   каждый сотрудник на 4–8 сменах, calculated_hours (целые) + calculated_pay.
 *
 * Запуск:   npm run demo:seed
 * Очистка:  npm run demo:cleanup
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD  = "Demo2026";
const DEMO_PHONE_PFX = "79161";           // 79161000001–79161000100
const DEMO_EVENT_PFX = "demo-event-";

// ─── Справочники ─────────────────────────────────────────────────────────────

const FIRST = ["Александр","Михаил","Дмитрий","Андрей","Сергей","Алексей","Николай","Иван","Артём","Павел","Евгений","Владимир","Роман","Антон","Илья","Максим","Олег","Денис","Виктор","Кирилл","Анна","Мария","Екатерина","Ольга","Наталья","Татьяна","Юлия","Светлана","Ирина","Елена","Валентина","Виктория","Кристина","Алина","Дарья","Полина","Ксения","Анастасия","Людмила","Вера"];
const LAST  = ["Иванов","Смирнов","Кузнецов","Попов","Васильев","Петров","Соколов","Михайлов","Новиков","Фёдоров","Морозов","Волков","Алексеев","Лебедев","Семёнов","Егоров","Павлов","Козлов","Степанов","Николаев","Орлов","Андреев","Макаров","Никитин","Захаров","Зайцев","Соловьёв","Борисов","Яковлев","Григорьев"];
const VENUES  = ["Radisson Royal","Lotte Hotel","Swissôtel Красные Холмы","Царицыно","Коломенское","Эрмитаж","Особняк на Петровке","Парк Горького","Pavilion","ВДНХ Павильон №1","River Palace","Artplay","ЦДХ","Нескучный сад","Дворец на Яузе","Marina Club","Зарядье","Шоколадный лофт","Сахаров-центр","Арт-кластер Октава"];
const CLIENTS = ["Альфа-Банк","Газпром","МТС","Яндекс","VK","Сбер HR","Лукойл","РЖД","Роснефть","Тинькофф","Аэрофлот","Росатом","Ростелеком","Магнит","X5 Retail","ВТБ","Металлоинвест","НЛМК","Северсталь","Частное торжество"];
const ETYPES  = ["Годовой корпоратив","Летний тимбилдинг","Фуршет","Банкет","Деловой ужин","Презентация","Свадебный приём","Юбилей","Конференц-ужин","VIP-приём","Гала-ужин","Cocktail party","Пикник","Корпоратив","Тематический ужин"];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad2(n: number) { return String(n).padStart(2, "0"); }

const HOURLY_RATE = 450;
const MIN_PAY     = 5000;
const MIN_HOURS   = 10; // первые 10 ч = минималка, сверху +450/ч

// Чистые часы без минут (floor)
function calcHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.floor((eh * 60 + em - sh * 60 - sm) / 60);
}

// 10 ч и меньше = 5000, свыше 10 = 5000 + (ч - 10) × 450
function calcPay(hours: number): number {
  if (hours <= MIN_HOURS) return MIN_PAY;
  return MIN_PAY + (hours - MIN_HOURS) * HOURLY_RATE;
}

// ─── 1. Сотрудники ────────────────────────────────────────────────────────────

async function seedEmployees(hash: string) {
  const used = new Set<string>();
  const rows = [];

  for (let i = 1; i <= 100; i++) {
    let name: string;
    do { name = `${pick(LAST)} ${pick(FIRST)}`; } while (used.has(name));
    used.add(name);

    const role  = "waiter" as const;
    const tier  = (i % 10 === 0 ? "core" : i % 4 === 0 ? "trainee" : "regular") as "core" | "regular" | "trainee";
    const phone = `${DEMO_PHONE_PFX}${String(i).padStart(6, "0")}`;

    rows.push({
      full_name:      name,
      phone,
      password_hash:  hash,
      role,
      tier,
      hourly_rate:    HOURLY_RATE,
      min_pay_hours:  MIN_HOURS,
      min_pay_amount: MIN_PAY,
    });
  }

  for (let i = 0; i < rows.length; i += 20) {
    await Promise.all(rows.slice(i, i + 20).map(r =>
      prisma.employee.upsert({
        where:  { phone: r.phone },
        update: { hourly_rate: r.hourly_rate, min_pay_hours: r.min_pay_hours, min_pay_amount: r.min_pay_amount },
        create: r,
      })
    ));
    process.stdout.write(`\r  Сотрудники: ${Math.min(i + 20, 100)}/100`);
  }
  console.log();

  return prisma.employee.findMany({
    where:  { phone: { startsWith: DEMO_PHONE_PFX } },
    select: { id: true, role: true, tier: true, hourly_rate: true, min_pay_amount: true },
  });
}

// ─── 2. Мероприятия ───────────────────────────────────────────────────────────

async function seedEvents(managerId: string) {
  const events = [];

  for (let i = 1; i <= 60; i++) {
    const day  = rand(1, 31);
    const hour = rand(12, 20);
    events.push({
      id:         `${DEMO_EVENT_PFX}${String(i).padStart(3, "0")}`,
      title:      `${pick(ETYPES)} · ${pick(CLIENTS)}`,
      client:     pick(CLIENTS),
      location:   pick(VENUES),
      starts_at:  new Date(2026, 6, day, hour, 0, 0), // июль
      status:     "done" as const,
      created_by: managerId,
    });
  }

  events.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

  for (let i = 0; i < events.length; i++) {
    await prisma.event.upsert({
      where:  { id: events[i].id },
      update: { title: events[i].title, status: "done" },
      create: events[i],
    });
    process.stdout.write(`\r  Мероприятия: ${i + 1}/60`);
  }
  console.log();
  return events;
}

// ─── 3. Назначения + записи времени ──────────────────────────────────────────

async function seedShifts(
  events:    { id: string; starts_at: Date }[],
  employees: { id: string; role: string; tier: string; hourly_rate: unknown; min_pay_amount: unknown }[]
) {
  const waiters = employees;
  const shifts  = new Map<string, number>(employees.map(e => [e.id, 0]));

  let aTotal = 0;
  let tTotal = 0;

  for (const event of events) {
    const wCount = rand(8, 18);

    await prisma.eventPosition.deleteMany({ where: { event_id: event.id } });
    const wPos = await prisma.eventPosition.create({
      data: { event_id: event.id, role: "waiter", needed_count: wCount },
    });

    const pickPool = (n: number) =>
      [...waiters]
        .filter(e => (shifts.get(e.id) ?? 0) < 8)
        .sort((a, b) => (shifts.get(a.id) ?? 0) - (shifts.get(b.id) ?? 0))
        .slice(0, n);

    const pairs = pickPool(wCount).map(e => ({ pos: wPos.id, emp: e }));

    const eventH = event.starts_at.getHours();
    const startH = Math.max(9,  eventH - rand(1, 3));
    const endH   = Math.min(23, eventH + rand(3, 6));
    const workDate = new Date(event.starts_at.toISOString().slice(0, 10));

    await Promise.all(pairs.map(async ({ pos, emp }) => {
      const sM = rand(0, 0);   // всегда ровный час — без минут в начале
      const eM = rand(0, 0);   // и в конце
      const start_time = `${pad2(startH)}:${pad2(sM)}`;
      const end_time   = `${pad2(endH)}:${pad2(eM)}`;

      const hours = calcHours(start_time, end_time);
      const calculated_pay = calcPay(hours);

      await prisma.assignment.upsert({
        where:  { position_id_employee_id: { position_id: pos, employee_id: emp.id } },
        update: { status: "confirmed" },
        create: { event_id: event.id, position_id: pos, employee_id: emp.id, status: "confirmed" },
      });

      await prisma.timeEntry.upsert({
        where:  { employee_id_event_id: { employee_id: emp.id, event_id: event.id } },
        update: { work_date: workDate, start_time, end_time, calculated_hours: hours, calculated_pay },
        create: { employee_id: emp.id, event_id: event.id, work_date: workDate, start_time, end_time, calculated_hours: hours, calculated_pay },
      });

      shifts.set(emp.id, (shifts.get(emp.id) ?? 0) + 1);
      aTotal++; tTotal++;
    }));

    process.stdout.write(`\r  Назначения: ${aTotal}, записи: ${tTotal}`);
  }

  console.log();

  // Статистика по сотрудникам
  const empShifts = [...shifts.entries()].filter(([, n]) => n > 0);
  const avg = (empShifts.reduce((s, [, n]) => s + n, 0) / empShifts.length).toFixed(1);
  console.log(`  Ср. смен на сотрудника: ${avg} (диапазон 4–8)`);

  return { aTotal, tTotal };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Demo seed: июль 2026...\n");

  const manager = await prisma.employee.findFirst({
    where:  { role: { in: ["manager", "owner", "admin"] } },
    select: { id: true },
  });
  if (!manager) throw new Error("Нет менеджера. Запустите npm run db:seed");

  const hash = await bcrypt.hash(DEMO_PASSWORD, 4);

  console.log("1/3 Сотрудники...");
  const employees = await seedEmployees(hash);

  console.log("2/3 Мероприятия...");
  const events = await seedEvents(manager.id);

  console.log("3/3 Смены + время...");
  const { aTotal, tTotal } = await seedShifts(events, employees);

  console.log(`
✓ Готово:
  Сотрудников:     ${employees.length}  (все официанты, ставка ${HOURLY_RATE} ₽/ч, минималка ${MIN_PAY} ₽)
  Мероприятий:     ${events.length}  (июль 2026, все done)
  Назначений:      ${aTotal}
  Записей времени: ${tTotal}  (calculated_hours + calculated_pay заполнены)

  Чтобы увидеть в Табеле/Зарплатах — переключи месяц на Июль 2026.
  Пароль: ${DEMO_PASSWORD}  |  Тел: ${DEMO_PHONE_PFX}000001 – ${DEMO_PHONE_PFX}000100
`);
}

if (require.main === module) {
  main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

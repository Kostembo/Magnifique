import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { canCreateEvents } from "@/lib/roles";
import { z } from "zod";
import {
  calcCheckinTime, calcCheckoutTime, calcPay,
  DEFAULT_MIN_PAY_AMOUNT, DEFAULT_MIN_PAY_HOURS,
} from "@/lib/payroll";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("checkout"),     employee_id: z.string() }),
  z.object({ action: z.literal("checkout_all") }),
  z.object({ action: z.literal("checkin"),      employee_id: z.string(), start_time: z.string().regex(/^\d{2}:\d{2}$/) }),
]);

const TZ = 3 * 60 * 60 * 1000; // MSK = UTC+3

function mskToUtc(workDate: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const mskDay = new Date(workDate.getTime() + TZ);
  const mskMidnight = Date.UTC(mskDay.getUTCFullYear(), mskDay.getUTCMonth(), mskDay.getUTCDate(), 0, 0, 0, 0);
  return new Date(mskMidnight + (h * 60 + m) * 60000 - TZ);
}

async function checkoutOne(employeeId: string, eventId: string, now: Date) {
  const entry = await prisma.timeEntry.findUnique({
    where: { employee_id_event_id: { employee_id: employeeId, event_id: eventId } },
    include: { employee: { select: { hourly_rate: true, min_pay_amount: true, min_pay_hours: true } } },
  });
  if (!entry?.checked_in_at) return null;

  const assignment = await prisma.assignment.findFirst({
    where: { employee_id: employeeId, event_id: eventId, status: "confirmed" },
    include: { event: { select: { starts_at: true, warehouse_time: true, venue_time: true } } },
  });

  const scheduledTime = new Date(
    assignment?.scheduled_time ??
    (assignment?.goes_to_warehouse ? assignment?.event.warehouse_time : null) ??
    assignment?.event.venue_time ??
    assignment?.event.starts_at ??
    now
  );

  const startTime = entry.start_time && entry.work_date
    ? mskToUtc(new Date(entry.work_date), entry.start_time)
    : calcCheckinTime(entry.checked_in_at, scheduledTime);

  const endTime   = calcCheckoutTime(now);

  const MAX_SHIFT_MS = 30 * 60 * 60 * 1000;
  if (endTime.getTime() - entry.checked_in_at.getTime() > MAX_SHIFT_MS)
    return null;

  const hours     = Math.max(0, (endTime.getTime() - startTime.getTime()) / 3600000);
  const hourlyRate   = entry.employee.hourly_rate    ? Number(entry.employee.hourly_rate)    : null;
  const minPayAmount = entry.employee.min_pay_amount ? Number(entry.employee.min_pay_amount) : DEFAULT_MIN_PAY_AMOUNT;
  const minPayHours  = entry.employee.min_pay_hours  ?? DEFAULT_MIN_PAY_HOURS;
  const pay = hourlyRate != null ? calcPay(hours, hourlyRate, minPayAmount, minPayHours) : null;

  await prisma.timeEntry.update({
    where: { id: entry.id },
    data: {
      checked_out_at: now,
      ...(pay != null && { calculated_hours: hours, calculated_pay: pay }),
    },
  });

  return { employee_id: employeeId, hours, pay };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !canCreateEvents(session.user.role ?? ""))
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });

  const now = new Date();

  // ── Чекин вручную ───────────────────────────────────────────────────────────
  if (parsed.data.action === "checkin") {
    const { employee_id, start_time } = parsed.data;

    const assignment = await prisma.assignment.findFirst({
      where: { employee_id, event_id: params.id, status: "confirmed" },
      include: { event: { select: { starts_at: true } } },
    });
    if (!assignment)
      return NextResponse.json({ error: "Нет подтверждённого назначения" }, { status: 404 });

    const workDate = new Date(assignment.event.starts_at);
    const entry = await prisma.timeEntry.upsert({
      where: { employee_id_event_id: { employee_id, event_id: params.id } },
      create: { employee_id, event_id: params.id, work_date: workDate, start_time, checked_in_at: now },
      update: { start_time, checked_in_at: now, checked_out_at: null, calculated_hours: null, calculated_pay: null },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  // ── Чекаут одного ────────────────────────────────────────────────────────────
  if (parsed.data.action === "checkout") {
    const result = await checkoutOne(parsed.data.employee_id, params.id, now);
    if (!result) return NextResponse.json({ error: "Сотрудник не найден или не чекинился" }, { status: 400 });
    return NextResponse.json(result);
  }

  // ── Чекаут всех ──────────────────────────────────────────────────────────────
  const activeEntries = await prisma.timeEntry.findMany({
    where: { event_id: params.id, checked_in_at: { not: null }, checked_out_at: null },
    select: { employee_id: true },
  });

  const results = await Promise.allSettled(
    activeEntries.map((e) => checkoutOne(e.employee_id, params.id, now))
  );
  const checkedOut = results.filter(
    (r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof checkoutOne>>>> =>
      r.status === "fulfilled" && r.value !== null
  ).length;

  return NextResponse.json({ checked_out: checkedOut });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateTimeEntry } from "@/lib/payroll";

const schema = z.object({
  event_id: z.string(),
  timestamp: z.string().datetime().optional(), // offline submissions
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const role = session.user.role ?? "";
  if (role !== "waiter" && role !== "cook") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  const { event_id, timestamp } = parsed.data;
  const employeeId = session.user.id;

  const entry = await prisma.timeEntry.findUnique({
    where: { employee_id_event_id: { employee_id: employeeId, event_id } },
    include: {
      employee: { select: { hourly_rate: true, min_pay_amount: true, min_pay_hours: true } },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Сначала нужно отметиться на смене" }, { status: 400 });
  }
  if (!entry.checked_in_at) {
    return NextResponse.json({ error: "Нет данных о начале смены" }, { status: 400 });
  }

  const now = timestamp ? new Date(timestamp) : new Date();
  if (now <= entry.checked_in_at) {
    return NextResponse.json({ error: "Время завершения не может быть раньше начала" }, { status: 400 });
  }
  const MAX_SHIFT_MS = 30 * 60 * 60 * 1000; // 30 часов
  if (now.getTime() - entry.checked_in_at.getTime() > MAX_SHIFT_MS) {
    return NextResponse.json({ error: "Смена не может длиться более 30 часов" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findFirst({
    where: { employee_id: employeeId, event_id, status: "confirmed" },
    include: {
      event: { select: { starts_at: true, warehouse_time: true, venue_time: true } },
    },
  });

  const scheduledTime =
    assignment?.scheduled_time ??
    (assignment?.goes_to_warehouse ? assignment?.event.warehouse_time : null) ??
    assignment?.event.venue_time ??
    assignment?.event.starts_at;

  const hourlyRate = entry.employee.hourly_rate ? Number(entry.employee.hourly_rate) : null;

  let calculated_hours: number | null = null;
  let calculated_pay: number | null = null;

  if (hourlyRate && scheduledTime) {
    const calc = calculateTimeEntry({
      checkedInAt: entry.checked_in_at,
      checkedOutAt: now,
      scheduledTime: new Date(scheduledTime),
      hourlyRate,
      minPayAmount: entry.employee.min_pay_amount ? Number(entry.employee.min_pay_amount) : undefined,
      minPayHours: entry.employee.min_pay_hours ?? undefined,
    });
    calculated_hours = calc.hours;
    calculated_pay = calc.pay;
  }

  const updated = await prisma.timeEntry.update({
    where: { employee_id_event_id: { employee_id: employeeId, event_id } },
    data: {
      checked_out_at: now,
      is_offline: !!timestamp || entry.is_offline,
      ...(calculated_hours !== null && { calculated_hours }),
      ...(calculated_pay !== null && { calculated_pay }),
    },
  });

  return NextResponse.json(updated);
}

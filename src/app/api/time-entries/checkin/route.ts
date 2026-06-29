import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

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

  const assignment = await prisma.assignment.findFirst({
    where: { employee_id: employeeId, event_id, status: "confirmed" },
    include: {
      event: { select: { starts_at: true, warehouse_time: true, venue_time: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Нет подтверждённого назначения для этого мероприятия" }, { status: 403 });
  }

  const now = timestamp ? new Date(timestamp) : new Date();

  // Validate: not before event start - 2h, not more than 30min in the future, not older 48h
  const eventStart = new Date(assignment.event.starts_at);
  const minTime = new Date(eventStart.getTime() - 60 * 60000); // окно -60 мин
  const maxTime = new Date(Date.now() + 30 * 60000);
  const maxPast = new Date(Date.now() - 48 * 3600000);
  if (now < minTime || now > maxTime || now < maxPast) {
    return NextResponse.json({ error: "Некорректное время чек-ина" }, { status: 400 });
  }

  const scheduledTime =
    assignment.scheduled_time ??
    (assignment.goes_to_warehouse ? assignment.event.warehouse_time : null) ??
    assignment.event.venue_time ??
    assignment.event.starts_at;

  const entry = await prisma.timeEntry.upsert({
    where: { employee_id_event_id: { employee_id: employeeId, event_id } },
    create: {
      employee_id: employeeId,
      event_id,
      work_date: new Date(scheduledTime),
      checked_in_at: now,
      is_offline: !!timestamp,
    },
    update: {
      checked_in_at: now,
      is_offline: !!timestamp,
      checked_out_at: null,
      calculated_hours: null,
      calculated_pay: null,
      pay_status: "draft",
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

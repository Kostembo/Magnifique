import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { sendPushToEmployee } from "@/lib/push";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  employee_id: z.string(),
  event_id: z.string(),
  position_id: z.number().int(),
  direct: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const { employee_id, event_id, position_id, direct } = parsed.data;

  const [employee, event, position] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employee_id },
      select: { id: true, full_name: true },
    }),
    prisma.event.findUnique({
      where: { id: event_id },
      select: { id: true, title: true, starts_at: true },
    }),
    prisma.eventPosition.findFirst({
      where: { id: position_id, event_id },
      select: { id: true, needed_count: true },
    }),
  ]);

  if (!employee)
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });
  if (!event)
    return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });
  if (!position)
    return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });

  const existing = await prisma.assignment.findFirst({
    where: { employee_id, position_id },
  });
  if (existing)
    return NextResponse.json({ error: "Сотрудник уже приглашён на эту позицию" }, { status: 409 });

  if (!direct) {
    const confirmedCount = await prisma.assignment.count({
      where: { position_id, status: "confirmed" },
    });
    if (confirmedCount >= position.needed_count)
      return NextResponse.json({ error: "Все слоты заняты" }, { status: 409 });
  }

  const status = direct ? "confirmed" : "invited";
  const assignment = await prisma.assignment.create({
    data: {
      event_id,
      position_id,
      employee_id,
      status,
      is_priority: false,
      responded_at: direct ? new Date() : undefined,
    },
  });

  // Push уведомление — некритично, не ломаем ответ при сбое
  try {
    if (direct) {
      await sendPushToEmployee(employee_id, {
        title: "Вы добавлены на мероприятие",
        body: `${event.title} — ${new Date(event.starts_at).toLocaleDateString("ru-RU")}`,
        url: `/events`,
        tag: `added-${event_id}`,
      });
    } else {
      await sendPushToEmployee(employee_id, {
        title: "Приглашение на мероприятие",
        body: `${event.title} — ${new Date(event.starts_at).toLocaleDateString("ru-RU")}`,
        url: `/invite/${event_id}`,
        tag: `invite-${event_id}`,
      });
    }
  } catch {
    // push не настроен или недоступен — assignment уже создан, продолжаем
  }

  return NextResponse.json(assignment);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

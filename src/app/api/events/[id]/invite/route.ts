import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToMany, sendPushToManagers } from "@/lib/push";
import { z } from "zod";

const inviteSchema = z.object({
  mode: z.enum(["core", "pool", "remind"]),
  position_id: z.number().int().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const { mode, position_id } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { positions: true },
  });
  if (!event) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const positions = position_id
    ? event.positions.filter((p) => p.id === position_id)
    : event.positions;

  const invitedIds: string[] = [];

  if (mode === "core") {
    // Приглашаем костяк для каждой позиции
    for (const pos of positions) {
      if (pos.reserved_for_core === 0) continue;

      const confirmedCount = await prisma.assignment.count({
        where: { position_id: pos.id, status: "confirmed" },
      });

      if (confirmedCount >= pos.needed_count) continue; // уже укомплектовано

      // Сотрудники костяка нужной роли без уже существующего приглашения
      const coreEmployees = await prisma.employee.findMany({
        where: {
          role: pos.role,
          tier: "core",
          is_active: true,
          assignments: { none: { position_id: pos.id } },
        },
        select: { id: true },
      });

      for (const emp of coreEmployees) {
        await prisma.assignment.create({
          data: {
            event_id: params.id,
            position_id: pos.id,
            employee_id: emp.id,
            status: "invited",
            is_priority: true,
          },
        });
        invitedIds.push(emp.id);
      }
    }

    await sendPushToMany(invitedIds, {
      title: `Приглашение на мероприятие`,
      body: `${event.title}${event.starts_at ? ` — ${new Date(event.starts_at).toLocaleDateString("ru-RU")}` : ""}`,
      url: `/events/${event.id}`,
      tag: `invite-${event.id}`,
    });

    return NextResponse.json({ invited: invitedIds.length });
  }

  if (mode === "pool") {
    // Открываем пул: истекаем оставшиеся is_priority-приглашения и приглашаем regular
    for (const pos of positions) {
      // Отмечаем незакрытые приоритетные как expired
      await prisma.assignment.updateMany({
        where: {
          position_id: pos.id,
          status: "invited",
          is_priority: true,
        },
        data: { status: "expired", responded_at: new Date() },
      });

      const confirmedCount = await prisma.assignment.count({
        where: { position_id: pos.id, status: "confirmed" },
      });
      const slotsLeft = pos.needed_count - confirmedCount;
      if (slotsLeft <= 0) continue;

      // Приглашаем regular-сотрудников нужной роли
      const regularEmployees = await prisma.employee.findMany({
        where: {
          role: pos.role,
          tier: { in: ["regular", "trainee"] },
          is_active: true,
          assignments: { none: { position_id: pos.id } },
        },
        select: { id: true },
      });

      for (const emp of regularEmployees) {
        await prisma.assignment.create({
          data: {
            event_id: params.id,
            position_id: pos.id,
            employee_id: emp.id,
            status: "invited",
            is_priority: false,
          },
        });
        invitedIds.push(emp.id);
      }
    }

    await sendPushToMany(invitedIds, {
      title: `Открыт набор: ${event.title}`,
      body: `Мероприятие ${new Date(event.starts_at).toLocaleDateString("ru-RU")} — подтвердите участие`,
      url: `/events`,
      tag: `pool-${event.id}`,
    });

    return NextResponse.json({ invited: invitedIds.length });
  }

  if (mode === "remind") {
    // Напоминаем молчунам (status=invited, не ответили)
    const silent = await prisma.assignment.findMany({
      where: {
        event_id: params.id,
        status: "invited",
      },
      select: { employee_id: true },
    });

    const silentIds = silent.map((a) => a.employee_id);

    await sendPushToMany(silentIds, {
      title: `Напоминание: ответьте на приглашение`,
      body: `${event.title} — ${new Date(event.starts_at).toLocaleDateString("ru-RU")}`,
      url: `/events`,
      tag: `remind-${event.id}`,
    });

    return NextResponse.json({ reminded: silentIds.length });
  }

  return NextResponse.json({ error: "Неизвестный режим" }, { status: 400 });
}

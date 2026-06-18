import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToManagers, sendPushToMany } from "@/lib/push";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["confirm", "decline"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      event: true,
      position: true,
      employee: { select: { id: true, full_name: true } },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  // Только владелец может ответить на своё приглашение
  if (assignment.employee_id !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  if (assignment.status !== "invited") {
    return NextResponse.json({ error: "Уже ответили на это приглашение" }, { status: 409 });
  }

  const { action } = parsed.data;

  if (action === "confirm") {
    // Проверяем, не переполнена ли позиция
    const confirmed = await prisma.assignment.count({
      where: { position_id: assignment.position_id, status: "confirmed" },
    });

    if (confirmed >= assignment.position.needed_count) {
      await prisma.assignment.update({
        where: { id: params.id },
        data: { status: "waitlisted", responded_at: new Date() },
      });
      await sendPushToManagers({
        title: `⏳ Хочет подтвердить: ${assignment.employee.full_name}`,
        body: `${assignment.event.title} — мест нет, но сотрудник хочет участвовать`,
        url: `/events/${assignment.event_id}`,
      });
      return NextResponse.json({ status: "waitlisted" });
    }

    await prisma.assignment.update({
      where: { id: params.id },
      data: { status: "confirmed", responded_at: new Date() },
    });

    // Проверяем, не стало ли всё мероприятие укомплектованным
    const allPositions = await prisma.eventPosition.findMany({
      where: { event_id: assignment.event_id },
      select: {
        needed_count: true,
        _count: { select: { assignments: { where: { status: "confirmed" } } } },
      },
    });

    const allStaffed = allPositions.every(
      (p) => p._count.assignments >= p.needed_count
    );

    if (allStaffed) {
      await prisma.event.update({
        where: { id: assignment.event_id },
        data: { status: "staffed" },
      });
    }

    // Уведомляем менеджеров
    await sendPushToManagers({
      title: `✅ Подтверждение: ${assignment.employee.full_name}`,
      body: `${assignment.event.title} — ${new Date(assignment.event.starts_at).toLocaleDateString("ru-RU")}`,
      url: `/events/${assignment.event_id}`,
    });

    return NextResponse.json({ status: "confirmed" });
  }

  // action === "decline"
  await prisma.assignment.update({
    where: { id: params.id },
    data: { status: "declined", responded_at: new Date() },
  });

  // Если это было приоритетное приглашение — проверяем, освободился ли слот для пула
  if (assignment.is_priority) {
    const pos = assignment.position;
    const now = new Date();
    const deadlinePassed = pos.priority_deadline && pos.priority_deadline < now;

    const coreInvitedLeft = await prisma.assignment.count({
      where: { position_id: pos.id, status: "invited", is_priority: true },
    });

    // Если всё приоритетное исчерпано или дедлайн прошёл — уведомляем о пуле
    if (coreInvitedLeft === 0 || deadlinePassed) {
      const confirmedCount = await prisma.assignment.count({
        where: { position_id: pos.id, status: "confirmed" },
      });
      const slotsLeft = pos.needed_count - confirmedCount;

      if (slotsLeft > 0) {
        await sendPushToManagers({
          title: `Слот освободился: ${assignment.event.title}`,
          body: `Откройте пул для позиции — осталось ${slotsLeft} мест`,
          url: `/events/${assignment.event_id}`,
        });
      }
    }
  }

  await sendPushToManagers({
    title: `❌ Отказ: ${assignment.employee.full_name}`,
    body: `${assignment.event.title} — ${new Date(assignment.event.starts_at).toLocaleDateString("ru-RU")}`,
    url: `/events/${assignment.event_id}`,
  });

  return NextResponse.json({ status: "declined" });
}

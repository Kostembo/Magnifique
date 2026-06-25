import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToEmployee } from "@/lib/push";
import { isPrivileged } from "@/lib/roles";
import { z } from "zod";

const patchSchema = z.object({
  goes_to_warehouse: z.boolean().optional(),
  scheduled_time: z.string().datetime().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({ where: { id: params.assignmentId } });
  if (!assignment || assignment.event_id !== params.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const updated = await prisma.assignment.update({
    where: { id: params.assignmentId },
    data: {
      ...(parsed.data.goes_to_warehouse !== undefined && { goes_to_warehouse: parsed.data.goes_to_warehouse }),
      ...(parsed.data.scheduled_time !== undefined && {
        scheduled_time: parsed.data.scheduled_time ? new Date(parsed.data.scheduled_time) : null,
      }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { event: { select: { title: true, starts_at: true, status: true } } },
  });

  if (!assignment || assignment.event_id !== params.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.assignment.delete({ where: { id: params.assignmentId } });

  // Если удалённый был confirmed и мероприятие было staffed — проверяем, нужен ли откат
  if (assignment.status === "confirmed" && assignment.event.status === "staffed") {
    const allPositions = await prisma.eventPosition.findMany({
      where: { event_id: assignment.event_id },
      select: {
        needed_count: true,
        _count: { select: { assignments: { where: { status: "confirmed" } } } },
      },
    });
    const stillStaffed = allPositions.length > 0 && allPositions.every((p) => p._count.assignments >= p.needed_count);
    if (!stillStaffed) {
      await prisma.event.update({
        where: { id: assignment.event_id },
        data: { status: "recruiting" },
      });
    }
  }

  const dateStr = assignment.event.starts_at
    ? new Date(assignment.event.starts_at).toLocaleDateString("ru-RU")
    : "";

  try {
    await sendPushToEmployee(assignment.employee_id, {
      title: "Вы удалены из мероприятия",
      body: `${assignment.event.title}${dateStr ? ` — ${dateStr}` : ""}`,
      url: "/events",
      tag: `removed-${params.assignmentId}`,
    });
  } catch { /* push некритичен */ }

  return NextResponse.json({ ok: true });
}

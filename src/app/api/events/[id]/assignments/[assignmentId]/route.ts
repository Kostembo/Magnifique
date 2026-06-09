import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToEmployee } from "@/lib/push";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { event: { select: { title: true, starts_at: true } } },
  });

  if (!assignment || assignment.event_id !== params.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.assignment.delete({ where: { id: params.assignmentId } });

  const dateStr = assignment.event.starts_at
    ? new Date(assignment.event.starts_at).toLocaleDateString("ru-RU")
    : "";

  await sendPushToEmployee(assignment.employee_id, {
    title: "Вы удалены из мероприятия",
    body: `${assignment.event.title}${dateStr ? ` — ${dateStr}` : ""}`,
    url: "/events",
    tag: `removed-${params.assignmentId}`,
  });

  return NextResponse.json({ ok: true });
}

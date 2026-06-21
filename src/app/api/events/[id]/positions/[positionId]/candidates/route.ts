import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; positionId: string } }
) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const positionId = parseInt(params.positionId, 10);
  if (isNaN(positionId)) return NextResponse.json({ error: "Неверный ID позиции" }, { status: 400 });

  const position = await prisma.eventPosition.findFirst({
    where: { id: positionId, event_id: params.id },
    select: { role: true, assignments: { select: { employee_id: true } } },
  });
  if (!position) return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });

  const assignedIds = position.assignments.map((a) => a.employee_id);

  const employees = await prisma.employee.findMany({
    where: {
      role: position.role,
      id: assignedIds.length ? { notIn: assignedIds } : undefined,
    },
    select: { id: true, full_name: true, tier: true, photo_url: true },
    orderBy: [{ tier: "asc" }, { full_name: "asc" }],
  });

  return NextResponse.json(employees);
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";

const POSITION_ROLES = ["waiter", "cook", "warehouse"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: { id: true, role: true },
  });
  if (!employee) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const posRole = POSITION_ROLES.find((r) => r === employee.role);
  if (!posRole) return NextResponse.json([]); // роль не участвует в позициях

  const events = await prisma.event.findMany({
    where: {
      status: { notIn: ["done"] },
      starts_at: { gte: new Date() },
      positions: { some: { role: posRole } },
      NOT: {
        positions: {
          some: {
            role: posRole,
            assignments: { some: { employee_id: params.id } },
          },
        },
      },
    },
    include: {
      positions: {
        where: { role: posRole },
        include: {
          assignments: { where: { status: "confirmed" }, select: { id: true } },
        },
      },
    },
    orderBy: { starts_at: "asc" },
    take: 20,
  });

  return NextResponse.json(
    events
      .map((ev) => {
        const pos = ev.positions[0];
        if (!pos) return null;
        return {
          eventId: ev.id,
          positionId: pos.id,
          title: ev.title,
          starts_at: ev.starts_at.toISOString(),
          location: ev.location,
          status: ev.status,
          slotsLeft: pos.needed_count - pos.assignments.length,
          neededCount: pos.needed_count,
        };
      })
      .filter(Boolean)
  );
}

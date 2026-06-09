import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Для сотрудников: их приглашения и подтверждённые смены
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const role = session.user.role;
  if (!["waiter", "cook", "bartender"].includes(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const [invitations, shifts] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        employee_id: session.user.id,
        status: "invited",
        event: { starts_at: { gte: new Date() }, status: { notIn: ["done"] } },
      },
      include: {
        event: {
          select: { id: true, title: true, client: true, location: true, starts_at: true },
        },
        position: { select: { role: true, needed_count: true } },
      },
      orderBy: { event: { starts_at: "asc" } },
    }),
    prisma.assignment.findMany({
      where: {
        employee_id: session.user.id,
        status: "confirmed",
        event: { starts_at: { gte: new Date() } },
      },
      include: {
        event: {
          select: { id: true, title: true, client: true, location: true, starts_at: true, status: true },
        },
      },
      orderBy: { event: { starts_at: "asc" } },
    }),
  ]);

  return NextResponse.json({ invitations, shifts });
}

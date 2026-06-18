import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const role = session.user.role;

  if (role === "warehouse") {
    return NextResponse.json({ invitations: [], recruiting: [] });
  }

  if (role === "waiter" || role === "cook") {
    const posRole = role as "waiter" | "cook";
    const showRecruiting = role === "waiter" && session.user.tier !== "core";

    const [invitations, recruitingEvents] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          employee_id: session.user.id,
          status: "invited",
          event: { starts_at: { gte: new Date() }, status: { notIn: ["done"] } },
        },
        include: {
          event: { select: { id: true, title: true, client: true, starts_at: true } },
          position: { select: { role: true } },
        },
        orderBy: { event: { starts_at: "asc" } },
      }),
      showRecruiting
        ? prisma.event.findMany({
            where: {
              status: "recruiting",
              starts_at: { gte: new Date() },
              positions: { some: { role: posRole } },
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
            take: 10,
          })
        : Promise.resolve([]),
    ]);

    const invitedEventIds = new Set(invitations.map((inv) => inv.event.id));

    const recruiting = recruitingEvents
      .filter((ev) => !invitedEventIds.has(ev.id))
      .map((ev) => {
        const pos = ev.positions[0];
        const confirmedCount = pos?.assignments.length ?? 0;
        const neededCount = pos?.needed_count ?? 0;
        return {
          eventId: ev.id,
          title: ev.title,
          client: ev.client,
          starts_at: ev.starts_at.toISOString(),
          slotsLeft: Math.max(0, neededCount - confirmedCount),
          neededCount,
        };
      });

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        event: { ...inv.event, starts_at: inv.event.starts_at.toISOString() },
        position: inv.position,
      })),
      recruiting,
    });
  }

  // Привилегированные роли: ближайшие мероприятия требующие внимания
  const events = await prisma.event.findMany({
    where: {
      status: { in: ["draft", "recruiting"] },
      starts_at: { gte: new Date() },
    },
    include: {
      positions: {
        include: { assignments: { where: { status: "confirmed" }, select: { id: true } } },
      },
    },
    orderBy: { starts_at: "asc" },
    take: 5,
  });

  return NextResponse.json({
    events: events.map((ev) => ({
      eventId: ev.id,
      title: ev.title,
      starts_at: ev.starts_at.toISOString(),
      status: ev.status,
      totalNeeded: ev.positions.reduce((s, p) => s + p.needed_count, 0),
      totalConfirmed: ev.positions.reduce((s, p) => s + p.assignments.length, 0),
    })),
  });
}

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged, canCreateEvents, canManageKitchen } from "@/lib/roles";
import { EventDetailClient } from "./_components/event-detail-client";

export const metadata = { title: "Мероприятие — Magnifique" };

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [event, timeEntry] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      include: {
        positions: {
          include: {
            assignments: {
              include: {
                employee: { select: { id: true, full_name: true, phone: true, role: true, tier: true } },
              },
              orderBy: { invited_at: "asc" },
            },
          },
        },
        requisitions: {
          include: { items: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        comments: {
          include: { author: { select: { id: true, full_name: true, role: true } } },
          orderBy: { created_at: "asc" },
        },
      },
    }),
    prisma.timeEntry.findUnique({
      where: { employee_id_event_id: { employee_id: session.user.id, event_id: params.id } },
      select: { checked_in_at: true, checked_out_at: true, calculated_hours: true, calculated_pay: true },
    }),
  ]);

  if (!event) notFound();

  const role = session.user.role;
  const isManager = isPrivileged(role) || canCreateEvents(role) || canManageKitchen(role);

  // waiter/cook видят мероприятие только при подтверждённом назначении
  if (role === "waiter" || role === "cook") {
    const hasAssignment = event.positions.some((p) =>
      p.assignments.some((a) => a.employee_id === session.user.id && a.status === "confirmed")
    );
    if (!hasAssignment) redirect("/events");
  }

  const hasConfirmedAssignment = event.positions.some((p) =>
    p.assignments.some((a) => a.employee_id === session.user.id && a.status === "confirmed")
  );

  return (
    <EventDetailClient
      event={event}
      isManager={isManager}
      role={role}
      currentUserId={session.user.id}
      timeEntry={timeEntry ? {
        checked_in_at: timeEntry.checked_in_at,
        checked_out_at: timeEntry.checked_out_at,
        calculated_hours: timeEntry.calculated_hours ? Number(timeEntry.calculated_hours) : null,
        calculated_pay: timeEntry.calculated_pay ? Number(timeEntry.calculated_pay) : null,
      } : null}
      hasConfirmedAssignment={hasConfirmedAssignment}
    />
  );
}

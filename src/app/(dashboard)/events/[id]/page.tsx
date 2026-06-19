import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged, canCreateEvents, canManageKitchen } from "@/lib/roles";
import { EventDetailClient } from "./_components/event-detail-client";

export const metadata = { title: "Мероприятие — Magnifique" };

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findUnique({
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
  });

  if (!event) notFound();

  const role = session.user.role;
  const isManager = isPrivileged(role) || canCreateEvents(role) || canManageKitchen(role);

  // waiter/cook видят мероприятие только если есть любой assignment (invited или confirmed)
  if (role === "waiter" || role === "cook") {
    const hasAssignment = event.positions.some((p) =>
      p.assignments.some((a) => a.employee_id === session.user.id)
    );
    if (!hasAssignment) redirect("/events");
  }

  return (
    <EventDetailClient
      event={event}
      isManager={isManager}
      role={role}
      currentUserId={session.user.id}
    />
  );
}

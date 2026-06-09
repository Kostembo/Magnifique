import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EventsManager } from "./_components/events-manager";
import { EventsStaff } from "./_components/events-staff";

export const metadata = { title: "Мероприятия — Magnifique" };

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  // Менеджер: список всех активных мероприятий
  if (role === "manager") {
    const events = await prisma.event.findMany({
      where: {},
      include: {
        positions: {
          include: {
            _count: { select: { assignments: { where: { status: "confirmed" } } } },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { starts_at: "asc" },
    });

    return <EventsManager events={events} />;
  }

  // Сотрудник: личный экран с приглашениями и сменами
  if (["waiter", "cook", "bartender"].includes(role)) {
    const [invitations, shifts] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          employee_id: session.user.id,
          status: "invited",
          event: { starts_at: { gte: new Date() }, status: { notIn: ["done"] } },
        },
        include: {
          event: { select: { id: true, title: true, client: true, location: true, starts_at: true } },
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
          event: { select: { id: true, title: true, client: true, location: true, starts_at: true, status: true } },
        },
        orderBy: { event: { starts_at: "asc" } },
      }),
    ]);

    return <EventsStaff invitations={invitations} shifts={shifts} />;
  }

  redirect("/");
}

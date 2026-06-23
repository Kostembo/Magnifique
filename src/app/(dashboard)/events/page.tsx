import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canCreateEvents } from "@/lib/roles";
import { EventsManager } from "./_components/events-manager";
import { EventsStaff } from "./_components/events-staff";

export const metadata = { title: "Мероприятия — Magnifique" };

const MANAGER_VIEW_ROLES = ["manager", "owner", "admin", "sales", "chef"];

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  // Менеджер / владелец / admin / sales / шеф: список всех мероприятий
  if (MANAGER_VIEW_ROLES.includes(role)) {
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

    return <EventsManager events={events} canCreate={canCreateEvents(role)} />;
  }

  // Сотрудник: только подтверждённые смены
  if (["waiter", "cook"].includes(role)) {
    const shifts = await prisma.assignment.findMany({
      where: {
        employee_id: session.user.id,
        status: "confirmed",
        event: { starts_at: { gte: new Date() } },
      },
      include: {
        event: { select: { id: true, title: true, client: true, location: true, starts_at: true, status: true } },
      },
      orderBy: { event: { starts_at: "asc" } },
    });

    return <EventsStaff shifts={shifts} />;
  }

  redirect("/");
}

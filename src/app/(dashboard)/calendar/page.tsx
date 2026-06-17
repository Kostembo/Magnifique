import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EventsCalendar } from "../events/_components/events-calendar";
import { StaffCalendar } from "../events/_components/staff-calendar";

export const metadata = { title: "Календарь — Magnifique" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId } = session.user;

  if (role === "manager") {
    const events = await prisma.event.findMany({
      where: { status: { not: "done" } },
      select: {
        id: true, title: true, starts_at: true, status: true,
        client: true, location: true, guests_count: true,
        positions: {
          select: {
            needed_count: true,
            assignments: { where: { status: "confirmed" }, select: { id: true } },
          },
        },
      },
      orderBy: { starts_at: "asc" },
    });

    const mapped = events.map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      status: e.status,
      client: e.client,
      location: e.location,
      guests_count: e.guests_count,
      confirmed_count: e.positions.reduce((s, p) => s + p.assignments.length, 0),
      needed_count: e.positions.reduce((s, p) => s + p.needed_count, 0),
    }));

    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">Календарь мероприятий</h1>
        <EventsCalendar events={mapped} />
      </div>
    );
  }

  // waiter / cook — личный календарь смен
  const shifts = await prisma.assignment.findMany({
    where: { employee_id: userId, status: "confirmed" },
    include: { event: { select: { id: true, title: true, starts_at: true } } },
    orderBy: { event: { starts_at: "asc" } },
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Мои смены</h1>
      <StaffCalendar shifts={shifts} />
    </div>
  );
}

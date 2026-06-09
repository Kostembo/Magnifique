import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CalendarGrid } from "./_components/calendar-grid";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isManager = session.user.role === "manager";

  let events;
  if (isManager) {
    events = await prisma.event.findMany({
      where: {},
      select: { id: true, title: true, starts_at: true, status: true },
      orderBy: { starts_at: "asc" },
    });
  } else {
    const assignments = await prisma.assignment.findMany({
      where: { employee_id: session.user.id, status: "confirmed" },
      include: { event: { select: { id: true, title: true, starts_at: true, status: true } } },
    });
    events = assignments.map((a) => a.event);
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Календарь</h1>
      <CalendarGrid events={events as any} />
    </div>
  );
}

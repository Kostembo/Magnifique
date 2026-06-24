import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { canCreateEvents } from "@/lib/roles";
import { StaffTimesheet } from "./_components/staff-timesheet";
import { ManagerTimesheet } from "./_components/manager-timesheet";

export default async function TimesheetPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isManager = canCreateEvents(session.user.role);

  if (isManager) {
    const now = new Date();
    const month = format(now, "yyyy-MM");
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const entries = await prisma.timeEntry.findMany({
      where: { work_date: { gte: from, lt: to } },
      include: { employee: { select: { id: true, full_name: true, role: true } } },
      orderBy: { work_date: "asc" },
    });

    return (
      <div className="p-4 md:p-6 max-w-full">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Табель</h1>
        <ManagerTimesheet initial={entries as any} initialMonth={month} />
      </div>
    );
  }

  // Staff view
  const assignments = await prisma.assignment.findMany({
    where: { employee_id: session.user.id, status: "confirmed" },
    include: { event: { select: { id: true, title: true, starts_at: true, location: true } } },
    orderBy: { event: { starts_at: "desc" } },
  });

  const eventIds = assignments.map((a) => a.event_id);
  const timeEntries = await prisma.timeEntry.findMany({
    where: { employee_id: session.user.id, event_id: { in: eventIds } },
    select: {
      id: true, event_id: true, start_time: true, end_time: true,
      checked_in_at: true, checked_out_at: true,
      calculated_hours: true, calculated_pay: true, pay_status: true,
    },
  });
  const entriesByEvent = Object.fromEntries(timeEntries.map((e) => [e.event_id, e]));
  const initial = assignments.map((a) => ({ ...a, timeEntry: entriesByEvent[a.event_id] ?? null }));

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Мои часы</h1>
      <StaffTimesheet initial={initial as any} />
    </div>
  );
}

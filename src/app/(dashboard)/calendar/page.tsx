import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { ManagerCalendar } from "./_components/manager-calendar";
import { StaffCalendar } from "../events/_components/staff-calendar";

export const metadata = { title: "Календарь — Magnifique" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId } = session.user;

  if (isPrivileged(role) || role === "sales" || role === "chef") {
    const events = await prisma.event.findMany({
      where: { status: { not: "done" } },
      select: { id: true, title: true, starts_at: true, status: true },
      orderBy: { starts_at: "asc" },
    });

    return (
      <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Календарь</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Мероприятия по датам</p>
        </div>
        <ManagerCalendar events={events} />
      </div>
    );
  }

  const shifts = await prisma.assignment.findMany({
    where: { employee_id: userId, status: "confirmed" },
    include: { event: { select: { id: true, title: true, starts_at: true } } },
    orderBy: { event: { starts_at: "asc" } },
  });

  return (
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Мои смены</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{shifts.length} подтверждённых смен</p>
      </div>
      <StaffCalendar shifts={shifts} />
    </div>
  );
}

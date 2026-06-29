import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { canCreateEvents } from "@/lib/roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || !canCreateEvents(session.user.role ?? ""))
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const [assignments, entries] = await Promise.all([
    prisma.assignment.findMany({
      where: { event_id: params.id, status: "confirmed" },
      include: { employee: { select: { id: true, full_name: true, role: true } } },
    }),
    prisma.timeEntry.findMany({
      where: { event_id: params.id },
      select: { id: true, employee_id: true, checked_in_at: true, checked_out_at: true, start_time: true },
    }),
  ]);

  const entryByEmp = new Map(entries.map((e) => [e.employee_id, e]));

  const checkedIn = [];
  const notCheckedIn = [];

  for (const a of assignments) {
    const emp = a.employee;
    const entry = entryByEmp.get(emp.id);
    if (entry?.checked_in_at && !entry.checked_out_at) {
      checkedIn.push({
        employee_id: emp.id,
        full_name: emp.full_name,
        role: emp.role,
        checked_in_at: entry.checked_in_at,
        start_time: entry.start_time,
        entry_id: entry.id,
      });
    } else if (!entry?.checked_out_at && !entry?.checked_in_at) {
      notCheckedIn.push({ employee_id: emp.id, full_name: emp.full_name, role: emp.role });
    }
  }

  checkedIn.sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));
  notCheckedIn.sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));

  return NextResponse.json({ checked_in: checkedIn, not_checked_in: notCheckedIn });
}

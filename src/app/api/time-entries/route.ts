import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Staff: GET their own assignments + time entries
// Manager: GET all entries for a month
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM

  if (session.user.role === "manager") {
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });
    const [year, mon] = month.split("-").map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 1);

    const entries = await prisma.timeEntry.findMany({
      where: { work_date: { gte: from, lt: to } },
      include: { employee: { select: { id: true, full_name: true, role: true } } },
      orderBy: { work_date: "asc" },
    });
    return NextResponse.json(entries);
  }

  // Staff: return their confirmed assignments with any time entry
  const assignments = await prisma.assignment.findMany({
    where: { employee_id: session.user.id, status: "confirmed" },
    include: {
      event: { select: { id: true, title: true, starts_at: true, location: true } },
      employee: { select: { id: true } },
    },
    orderBy: { event: { starts_at: "desc" } },
  });

  const eventIds = assignments.map((a) => a.event_id);
  const timeEntries = await prisma.timeEntry.findMany({
    where: { employee_id: session.user.id, event_id: { in: eventIds } },
  });

  const entriesByEvent = Object.fromEntries(timeEntries.map((e) => [e.event_id, e]));
  return NextResponse.json(assignments.map((a) => ({ ...a, timeEntry: entriesByEvent[a.event_id] ?? null })));
}

// Staff: upsert their own time entry for an event
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { event_id, work_date, start_time, end_time } = await request.json();
  if (!event_id || !work_date || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify employee is assigned to this event
  const assignment = await prisma.assignment.findFirst({
    where: { employee_id: session.user.id, event_id, status: "confirmed" },
  });
  if (!assignment) return NextResponse.json({ error: "Not assigned" }, { status: 403 });

  const entry = await prisma.timeEntry.upsert({
    where: { employee_id_event_id: { employee_id: session.user.id, event_id } },
    create: { employee_id: session.user.id, event_id, work_date: new Date(work_date), start_time, end_time },
    update: { work_date: new Date(work_date), start_time, end_time },
  });
  return NextResponse.json(entry);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewPayroll } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  if (!canViewPayroll(session.user.role ?? "")) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month) return NextResponse.json({ error: "Укажите month (YYYY-MM)" }, { status: 400 });

  const [year, mon] = month.split("-").map(Number);
  const from = new Date(year, mon - 1, 1);
  const to = new Date(year, mon, 1);

  const entries = await prisma.timeEntry.findMany({
    where: { work_date: { gte: from, lt: to } },
    include: {
      employee: { select: { id: true, full_name: true, role: true } },
      event: { select: { id: true, title: true, starts_at: true } },
    },
    orderBy: [{ employee: { full_name: "asc" } }, { work_date: "asc" }],
  });

  return NextResponse.json(entries);
}

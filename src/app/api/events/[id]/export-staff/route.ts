import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { event_id: params.id, status: "confirmed" },
    include: {
      employee: { select: { full_name: true, phone: true, role: true, tier: true } },
      position: { select: { role: true } },
    },
    orderBy: { employee: { full_name: "asc" } },
  });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { title: true, starts_at: true },
  });

  const ROLE_LABELS: Record<string, string> = {
    waiter: "Официант", cook: "Повар", warehouse: "Склад", manager: "Менеджер",
  };
  const TIER_LABELS: Record<string, string> = {
    core: "Костяк", regular: "Основной", trainee: "Стажёр",
  };

  const rows = [
    ["ФИО", "Телефон", "Должность", "Уровень"],
    ...assignments.map((a) => [
      a.employee.full_name,
      a.employee.phone,
      ROLE_LABELS[a.employee.role] ?? a.employee.role,
      TIER_LABELS[a.employee.tier] ?? a.employee.tier,
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const filename = `staff_${event?.title ?? params.id}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

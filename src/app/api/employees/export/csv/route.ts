import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const employees = await prisma.employee.findMany({
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
    select: { id: true, full_name: true, phone: true, role: true, tier: true, created_at: true },
  });

  const headers = ["ФИО", "Телефон", "Роль", "Уровень", "Добавлен"];
  const rows = employees.map((e) => [
    e.full_name,
    formatPhone(e.phone),
    ROLE_LABELS[e.role] ?? e.role,
    TIER_LABELS[e.tier] ?? e.tier,
    new Date(e.created_at).toLocaleDateString("ru-RU"),
  ]);

  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
  );

  const csv = "﻿" + csvLines.join("\r\n"); // BOM для корректного отображения в Excel

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="employees_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const { role } = session.user;
  if (!["manager", "warehouse"].includes(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const requisitions = await prisma.requisition.findMany({
    where: role === "warehouse"
      ? { status: { in: ["sent", "picking", "done"] as Prisma.EnumRequisitionStatusFilter["in"] } }
      : undefined,
    include: {
      event: { select: { id: true, title: true, starts_at: true, client: true } },
      assignee: { select: { id: true, full_name: true } },
      items: { select: { id: true, is_picked: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(requisitions);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 });

  const existing = await prisma.requisition.findFirst({ where: { event_id: params.id } });
  if (existing) return NextResponse.json(existing);

  const requisition = await prisma.requisition.create({
    data: { event_id: params.id },
    include: { items: true },
  });

  return NextResponse.json(requisition, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewRequisitions, isPrivileged } from "@/lib/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const { role } = session.user;
  if (!canViewRequisitions(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const itemId = parseInt(params.itemId, 10);
  const item = await prisma.requisitionItem.findUnique({ where: { id: itemId } });
  if (!item || item.requisition_id !== params.id) {
    return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.requisitionItem.update({
    where: { id: itemId },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const itemId = parseInt(params.itemId, 10);
  const item = await prisma.requisitionItem.findUnique({ where: { id: itemId } });
  if (!item || item.requisition_id !== params.id) {
    return NextResponse.json({ error: "Позиция не найдена" }, { status: 404 });
  }

  const requisition = await prisma.requisition.findUnique({ where: { id: params.id } });
  if (requisition?.status !== "draft") {
    return NextResponse.json({ error: "Заявка уже отправлена" }, { status: 400 });
  }

  await prisma.requisitionItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}

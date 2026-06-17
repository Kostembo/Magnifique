import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isPrivileged } from "@/lib/roles";

const schema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const item = await prisma.menuItem.update({
    where: { id: Number(params.id) },
    data: parsed.data,
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.menuItem.update({
    where: { id: Number(params.id) },
    data: { is_active: false },
  });
  return NextResponse.json({ ok: true });
}

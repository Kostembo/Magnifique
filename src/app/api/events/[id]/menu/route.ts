import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canCreateEvents, canManageKitchen } from "@/lib/roles";

const itemSchema = z.object({
  menu_item_id: z.number().int().optional().nullable(),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default("порц"),
  note: z.string().optional().nullable(),
});

const createSchema = z.object({ items: z.array(itemSchema).min(1) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const role = session.user.role;
  if (!canCreateEvents(role) && !canManageKitchen(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const items = await prisma.eventMenuItem.findMany({
    where: { event_id: params.id },
    include: { menu_item: { select: { id: true, name: true, category: true } } },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !canCreateEvents(session.user.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.eventMenuItem.deleteMany({ where: { event_id: params.id } });

  const items = await prisma.eventMenuItem.createMany({
    data: parsed.data.items.map((item) => ({
      event_id: params.id,
      menu_item_id: item.menu_item_id ?? null,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      note: item.note ?? null,
    })),
  });

  return NextResponse.json({ count: items.count }, { status: 201 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !canCreateEvents(session.user.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.eventMenuItem.deleteMany({ where: { event_id: params.id } });
  return NextResponse.json({ ok: true });
}

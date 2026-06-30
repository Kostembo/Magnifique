import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { z } from "zod";

function requireManager(session: { user?: { role?: string } } | null) {
  if (!session?.user || !isPrivileged(session.user.role ?? ""))
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  return null;
}

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  note: z.string().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  menu_items: z.array(itemSchema).optional(),
  warehouse_items: z.array(itemSchema.omit({ note: true })).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const template = await prisma.eventTemplate.findUnique({
    where: { id: Number(params.id) },
    include: { menu_items: true, warehouse_items: true },
  });

  if (!template) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });

  const { name, menu_items, warehouse_items } = parsed.data;
  const id = Number(params.id);

  const template = await prisma.$transaction(async (tx) => {
    if (menu_items !== undefined) {
      await tx.templateMenuItem.deleteMany({ where: { template_id: id } });
      await tx.templateMenuItem.createMany({ data: menu_items.map((i) => ({ ...i, template_id: id })) });
    }
    if (warehouse_items !== undefined) {
      await tx.templateWarehouseItem.deleteMany({ where: { template_id: id } });
      await tx.templateWarehouseItem.createMany({ data: warehouse_items.map((i) => ({ ...i, template_id: id })) });
    }
    return tx.eventTemplate.update({
      where: { id },
      data: name ? { name } : {},
      include: { menu_items: true, warehouse_items: true },
    });
  });

  return NextResponse.json(template);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  await prisma.eventTemplate.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}

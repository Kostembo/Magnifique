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

const createSchema = z.object({
  name: z.string().min(1),
  menu_items: z.array(itemSchema).default([]),
  warehouse_items: z.array(itemSchema.omit({ note: true })).default([]),
});

export async function GET() {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const templates = await prisma.eventTemplate.findMany({
    include: { menu_items: true, warehouse_items: true },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });

  const { name, menu_items, warehouse_items } = parsed.data;

  const template = await prisma.eventTemplate.create({
    data: {
      name,
      menu_items: { create: menu_items },
      warehouse_items: { create: warehouse_items },
    },
    include: { menu_items: true, warehouse_items: true },
  });

  return NextResponse.json(template, { status: 201 });
}

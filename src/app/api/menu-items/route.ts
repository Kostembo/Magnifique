import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isPrivileged } from "@/lib/roles";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().default(""),
  unit: z.string().default("порц"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const items = await prisma.menuItem.findMany({
    where: { is_active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.menuItem.create({ data: parsed.data });
  return NextResponse.json(item, { status: 201 });
}

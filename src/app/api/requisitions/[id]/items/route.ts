import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Введите название"),
  quantity: z.number().positive("Количество должно быть больше 0"),
  unit: z.string().min(1).default("шт"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const requisition = await prisma.requisition.findUnique({ where: { id: params.id } });
  if (!requisition) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  if (requisition.status !== "draft") {
    return NextResponse.json({ error: "Заявка уже отправлена" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const item = await prisma.requisitionItem.create({
    data: { requisition_id: params.id, ...parsed.data },
  });

  return NextResponse.json(item, { status: 201 });
}

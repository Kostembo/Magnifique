import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  new_password: z.string().min(6, "Минимум 6 символов"),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!employee) return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });

  const hash = await bcrypt.hash(parsed.data.new_password, 12);
  await prisma.employee.update({ where: { id: params.id }, data: { password_hash: hash } });

  return NextResponse.json({ ok: true });
}

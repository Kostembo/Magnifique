import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateEvents, canViewPayroll } from "@/lib/roles";
import { z } from "zod";

const timeSchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Формат HH:MM"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Формат HH:MM"),
});

const paySchema = z.object({
  pay_status: z.enum(["draft", "confirmed", "paid"]),
  pay_comment: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const role = session.user.role ?? "";
  const body = await req.json().catch(() => ({}));

  const entry = await prisma.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  if ("pay_status" in body) {
    if (!canViewPayroll(role)) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    const parsed = paySchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: { pay_status: parsed.data.pay_status, pay_comment: parsed.data.pay_comment ?? null },
    });
    return NextResponse.json(updated);
  }

  if (!canCreateEvents(role)) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const parsed = timeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.timeEntry.update({
    where: { id: params.id },
    data: { start_time: parsed.data.start_time, end_time: parsed.data.end_time },
    include: { employee: { select: { id: true, full_name: true, role: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || !canCreateEvents(session.user.role ?? ""))
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const entry = await prisma.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  await prisma.timeEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

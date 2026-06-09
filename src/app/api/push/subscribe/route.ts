import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await req.json();
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверный формат подписки" }, { status: 400 });
  }

  await prisma.employee.update({
    where: { id: session.user.id },
    data: { push_subscription: parsed.data },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  await prisma.employee.update({
    where: { id: session.user.id },
    data: { push_subscription: Prisma.DbNull },
  });

  return NextResponse.json({ ok: true });
}

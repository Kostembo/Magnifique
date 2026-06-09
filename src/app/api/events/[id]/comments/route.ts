import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const comments = await prisma.comment.findMany({
    where: { event_id: params.id },
    include: {
      author: { select: { id: true, full_name: true, role: true } },
    },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await req.json();
  const parsed = z.object({ body: z.string().min(1).max(2000) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      event_id: params.id,
      author_id: session.user.id,
      body: parsed.data.body,
    },
    include: {
      author: { select: { id: true, full_name: true, role: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

function requireManager(session: { user?: { role?: string } } | null) {
  if (!session?.user || session.user.role !== "manager") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      positions: {
        include: {
          assignments: {
            include: {
              employee: {
                select: { id: true, full_name: true, phone: true, role: true, tier: true },
              },
            },
            orderBy: { invited_at: "asc" },
          },
        },
      },
      requisitions: {
        include: { items: true },
        orderBy: { created_at: "desc" },
        take: 1,
      },
      comments: {
        include: {
          author: { select: { id: true, full_name: true, role: true } },
        },
        orderBy: { created_at: "asc" },
      },
      creator: { select: { id: true, full_name: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  // Проверка доступа: staff видит только свои мероприятия (через assignments)
  const role = session.user.role;
  if (role !== "manager" && role !== "warehouse") {
    const hasAssignment = event.positions.some((pos) =>
      pos.assignments.some(
        (a) => a.employee_id === session.user.id && a.status === "confirmed"
      )
    );
    if (!hasAssignment) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
  }

  return NextResponse.json(event);
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  client: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string().datetime().optional(),
  status: z.enum(["draft", "recruiting", "staffed", "done"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  const { starts_at, ...rest } = parsed.data;

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(starts_at ? { starts_at: new Date(starts_at) } : {}),
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  await prisma.event.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}

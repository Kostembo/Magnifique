import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { z } from "zod";

function requireManager(session: { user?: { role?: string } } | null) {
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
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
  if (role === "waiter" || role === "cook") {
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

const positionSchema = z.object({
  role: z.enum(["waiter", "cook", "warehouse"]),
  needed_count: z.number().int().min(1),
  reserved_for_core: z.number().int().min(0).default(0),
  priority_deadline: z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  client: z.string().optional(),
  location: z.string().optional(),
  guests_count: z.number().int().min(1).optional().nullable(),
  starts_at: z.string().datetime().optional(),
  status: z.enum(["draft", "recruiting", "staffed", "done"]).optional(),
  positions: z.array(positionSchema).optional(),
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
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  const { starts_at, positions, status, ...rest } = parsed.data;

  if (status !== undefined) {
    const current = await prisma.event.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!current) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    // Owner/admin могут переставить статус в любое состояние вручную
    const isSuper = ["owner", "admin"].includes(session!.user!.role ?? "");
    if (!isSuper) {
      const ALLOWED: Record<string, string[]> = {
        draft:      ["recruiting"],
        recruiting: ["staffed", "done", "draft"],
        staffed:    ["recruiting", "done"],
        done:       ["staffed", "recruiting"],
      };
      if (!(ALLOWED[current.status] ?? []).includes(status)) {
        return NextResponse.json(
          { error: `Переход «${current.status}» → «${status}» недопустим` },
          { status: 422 }
        );
      }
    }
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(status !== undefined ? { status } : {}),
      ...(starts_at ? { starts_at: new Date(starts_at) } : {}),
    },
    include: { positions: true },
  });

  // Upsert позиций: добавляем новые, обновляем существующие по role.
  // Существующие позиции с assignments не удаляем — это защищает уже созданные приглашения.
  if (positions && positions.length > 0) {
    for (const pos of positions) {
      const existing = event.positions.find((p) => p.role === pos.role);
      if (existing) {
        await prisma.eventPosition.update({
          where: { id: existing.id },
          data: {
            needed_count: pos.needed_count,
            reserved_for_core: pos.reserved_for_core,
            priority_deadline: pos.priority_deadline ? new Date(pos.priority_deadline) : null,
          },
        });
      } else {
        await prisma.eventPosition.create({
          data: {
            event_id: params.id,
            role: pos.role,
            needed_count: pos.needed_count,
            reserved_for_core: pos.reserved_for_core,
            priority_deadline: pos.priority_deadline ? new Date(pos.priority_deadline) : null,
          },
        });
      }
    }
  }

  const updated = await prisma.event.findUnique({
    where: { id: params.id },
    include: { positions: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  try {
    await prisma.event.delete({ where: { id: params.id } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

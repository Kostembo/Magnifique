import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { canCreateEvents } from "@/lib/roles";

function requireEventCreator(session: { user?: { role?: string } } | null) {
  if (!session?.user || !canCreateEvents(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  return null;
}

const positionSchema = z.object({
  role: z.enum(["waiter", "cook", "warehouse", "chef"]),
  needed_count: z.number().int().min(1),
  reserved_for_core: z.number().int().min(0).default(0),
  priority_deadline: z.string().datetime().optional().nullable(),
});

const createSchema = z.object({
  title: z.string().min(1),
  client: z.string().optional(),
  location: z.string().optional(),
  guests_count: z.number().int().min(1).optional(),
  starts_at: z.string().datetime(),
  positions: z.array(positionSchema).min(1, "Добавьте хотя бы одну позицию"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const events = await prisma.event.findMany({
    where: {
      ...(status ? { status: status as "draft" | "recruiting" | "staffed" | "done" } : {
        status: { notIn: ["done"] },
      }),
      ...(from || to
        ? {
            starts_at: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      positions: {
        include: {
          _count: {
            select: {
              assignments: { where: { status: "confirmed" } },
            },
          },
        },
      },
      requisitions: {
        select: { id: true, status: true },
        take: 1,
        orderBy: { created_at: "desc" },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: { starts_at: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const denied = requireEventCreator(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  const { positions, ...eventData } = parsed.data;

  const event = await prisma.event.create({
    data: {
      ...eventData,
      starts_at: new Date(eventData.starts_at),
      status: "recruiting",
      created_by: session!.user!.id,
      positions: {
        create: positions.map((p) => ({
          ...p,
          priority_deadline: p.priority_deadline ? new Date(p.priority_deadline) : null,
        })),
      },
    },
    include: {
      positions: true,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { sendPushToWarehouse } from "@/lib/push";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const { role } = session.user;
  if (!["manager", "warehouse"].includes(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const req = await prisma.requisition.findUnique({
    where: { id: params.id },
    include: {
      event: { select: { id: true, title: true, starts_at: true, client: true } },
      assignee: { select: { id: true, full_name: true } },
      items: { orderBy: { id: "asc" } },
    },
  });

  if (!req) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

  return NextResponse.json(req);
}

const patchSchema = z.object({
  status: z.enum(["sent", "picking", "done"]).optional(),
  assignee_id: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const { role } = session.user;
  if (!["manager", "warehouse"].includes(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const existing = await prisma.requisition.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

  const { status, assignee_id } = parsed.data;

  if (status === "sent" && !isPrivileged(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  if ((status === "picking" || status === "done") && role !== "warehouse" && !isPrivileged(role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const updated = await prisma.requisition.update({
    where: { id: params.id },
    data: {
      ...(status ? { status, ...(status === "sent" ? { sent_at: new Date() } : {}) } : {}),
      ...(assignee_id !== undefined ? { assignee_id } : {}),
    },
    include: {
      event: { select: { id: true, title: true, starts_at: true, client: true } },
      assignee: { select: { id: true, full_name: true } },
      items: { orderBy: { id: "asc" } },
    },
  });

  if (status === "sent") {
    const eventTitle = updated.event?.title ?? "Мероприятие";
    const dateStr = updated.event?.starts_at
      ? new Date(updated.event.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
      : "";
    await sendPushToWarehouse({
      title: "Новая заявка на сбор",
      body: `${eventTitle}${dateStr ? ` — ${dateStr}` : ""}`,
      url: `/requisitions/${updated.id}`,
      tag: `requisition-${updated.id}`,
    });
  }

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptPassportData, decryptPassportData } from "@/lib/crypto";
import { isPrivileged, isSuper } from "@/lib/roles";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { normalizePhone } from "@/lib/utils";
import { Prisma } from "@prisma/client";

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
  const denied = requireManager(session);
  if (denied) return denied;

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true, full_name: true, phone: true, role: true, tier: true,
      created_at: true, passport_data_enc: true, photo_url: true,
    },
  });

  if (!employee) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  const { passport_data_enc, ...rest } = employee;
  const passport_data = passport_data_enc ? decryptPassportData(passport_data_enc) : null;

  return NextResponse.json({ ...rest, passport_data });
}

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["waiter", "cook", "warehouse", "manager", "sales", "chef", "owner", "admin"]).optional(),
  tier: z.enum(["core", "regular", "trainee"]).optional(),
  passport_data: z.string().optional().nullable(),
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

  const { phone, password, passport_data, ...rest } = parsed.data;

  const callerRole = session!.user.role ?? "";
  if (rest.role && isSuper(rest.role) && !isSuper(callerRole)) {
    return NextResponse.json({ error: "Недостаточно прав для назначения этой роли" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { ...rest };

  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    const conflict = await prisma.employee.findFirst({
      where: { phone: normalizedPhone, id: { not: params.id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Сотрудник с таким номером уже существует" }, { status: 409 });
    }
    updateData.phone = normalizedPhone;
  }

  if (password) {
    updateData.password_hash = await bcrypt.hash(password, 12);
  }

  if (passport_data !== undefined) {
    updateData.passport_data_enc = passport_data ? encryptPassportData(passport_data) : null;
  }

  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, full_name: true, phone: true, role: true, tier: true, created_at: true },
  });

  return NextResponse.json(employee);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  if (session!.user.id === params.id) {
    return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 403 });
  }

  const target = await prisma.employee.findUnique({
    where: { id: params.id },
    select: { role: true },
  });
  if (!target) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  if (["admin", "owner"].includes(target.role)) {
    return NextResponse.json({ error: "Нельзя удалить администратора или владельца" }, { status: 403 });
  }

  try {
    await prisma.employee.delete({ where: { id: params.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "Нельзя уволить сотрудника: у него есть история смен или мероприятий. Обратитесь к администратору." },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptPassportData, decryptPassportData } from "@/lib/crypto";
import { isPrivileged } from "@/lib/roles";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { normalizePhone } from "@/lib/utils";

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
      is_active: true, created_at: true, passport_data_enc: true, photo_url: true,
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
  is_active: z.boolean().optional(),
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
    select: { id: true, full_name: true, phone: true, role: true, tier: true, is_active: true, created_at: true },
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

  await prisma.employee.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}

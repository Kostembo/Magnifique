import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptPassportData } from "@/lib/crypto";
import { isPrivileged } from "@/lib/roles";
import type { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { normalizePhone } from "@/lib/utils";

const createSchema = z.object({
  full_name: z.string().min(2, "Укажите ФИО"),
  phone: z.string().min(10, "Укажите телефон"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  role: z.enum(["waiter", "cook", "warehouse", "manager", "sales", "chef", "owner", "admin"]),
  tier: z.enum(["core", "regular", "trainee"]).default("regular"),
  passport_data: z.string().optional(),
});

function requireManager(session: { user?: { role?: string } } | null) {
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const role = searchParams.get("role") ?? undefined;
  const tier = searchParams.get("tier") ?? undefined;
  const active = searchParams.get("active");
  const search = searchParams.get("search") ?? "";

  const employees = await prisma.employee.findMany({
    where: {
      ...(role ? { role: role as Role } : {}),
      ...(tier ? { tier: tier as "core" | "regular" | "trainee" } : {}),
      ...(active !== null ? { is_active: active === "true" } : {}),
      ...(search
        ? {
            OR: [
              { full_name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      full_name: true,
      phone: true,
      role: true,
      tier: true,
      is_active: true,
      created_at: true,
    },
    orderBy: { full_name: "asc" },
  });

  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const denied = requireManager(session);
  if (denied) return denied;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  const { full_name, phone, password, role, tier, passport_data } = parsed.data;
  const normalizedPhone = normalizePhone(phone);

  const existing = await prisma.employee.findUnique({ where: { phone: normalizedPhone } });
  if (existing) {
    return NextResponse.json({ error: "Сотрудник с таким номером уже существует" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const passport_data_enc = passport_data ? encryptPassportData(passport_data) : null;

  const employee = await prisma.employee.create({
    data: { full_name, phone: normalizedPhone, password_hash, role, tier, passport_data_enc },
    select: { id: true, full_name: true, phone: true, role: true, tier: true, is_active: true, created_at: true, photo_url: true },
  });

  return NextResponse.json(employee, { status: 201 });
}

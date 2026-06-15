import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB — клиент всегда сжимает до ~50-80 КБ

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;

  if (!file) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 2 МБ)" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "employees");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${params.id}.webp`;
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  const photo_url = `/uploads/employees/${filename}`;

  await prisma.employee.update({
    where: { id: params.id },
    data: { photo_url },
  });

  return NextResponse.json({ photo_url });
}

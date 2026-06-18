import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const filePath = path.join(process.cwd(), "public", "uploads", "employees", `${params.id}.webp`);
  try {
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) {
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

  const photo_url = `/api/employees/${params.id}/photo`;

  await prisma.employee.update({
    where: { id: params.id },
    data: { photo_url },
  });

  return NextResponse.json({ photo_url });
}

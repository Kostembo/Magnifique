import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

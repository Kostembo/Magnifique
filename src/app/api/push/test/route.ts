import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendPushToEmployee } from "@/lib/push";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const result = await sendPushToEmployee(session.user.id, {
    title: "Magnifique — тест",
    body: "Уведомления работают! 🎉",
    url: "/",
    tag: "test",
  });

  if (result === "no_subscription") {
    return NextResponse.json({ error: "Сначала подпишитесь на уведомления" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { TemplatesClient } from "./_components/templates-client";

export const metadata = { title: "Шаблоны — Magnifique" };

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) redirect("/");

  const raw = await prisma.eventTemplate.findMany({
    include: { menu_items: true, warehouse_items: true },
    orderBy: { created_at: "desc" },
  });

  const templates = raw.map((t) => ({
    ...t,
    menu_items: t.menu_items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
    warehouse_items: t.warehouse_items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
  }));

  return <TemplatesClient initialTemplates={templates} />;
}

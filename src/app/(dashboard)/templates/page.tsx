import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { TemplatesClient } from "./_components/templates-client";

export const metadata = { title: "Шаблоны — Magnifique" };

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) redirect("/");

  const templates = await prisma.eventTemplate.findMany({
    include: { menu_items: true, warehouse_items: true },
    orderBy: { created_at: "desc" },
  });

  return <TemplatesClient initialTemplates={templates} />;
}

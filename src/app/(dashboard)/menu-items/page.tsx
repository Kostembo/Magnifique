import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPrivileged } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { MenuItemsClient } from "./_components/menu-items-client";

export const metadata = { title: "Каталог меню — Magnifique" };

export default async function MenuItemsPage() {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role)) redirect("/");

  const items = await prisma.menuItem.findMany({
    where: { is_active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <MenuItemsClient initialItems={items} />;
}

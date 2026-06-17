import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPrivileged } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { WarehouseItemsClient } from "./_components/warehouse-items-client";

export default async function WarehouseItemsPage() {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role)) redirect("/");

  const items = await prisma.warehouseItem.findMany({
    where: { is_active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <WarehouseItemsClient initialItems={items} />;
}

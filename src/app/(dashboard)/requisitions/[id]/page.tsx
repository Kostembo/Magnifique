import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { canViewRequisitions, isPrivileged } from "@/lib/roles";
import { RequisitionDetailClient } from "./_components/requisition-detail-client";

export default async function RequisitionDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { role } = session.user;
  if (!canViewRequisitions(role)) redirect("/events");

  const req = await prisma.requisition.findUnique({
    where: { id: params.id },
    include: {
      event: { select: { id: true, title: true, starts_at: true, client: true } },
      assignee: { select: { id: true, full_name: true } },
      items: { orderBy: { id: "asc" } },
    },
  });

  if (!req) notFound();

  const serialized = {
    ...req,
    items: req.items.map((item) => ({ ...item, quantity: item.quantity.toString() })),
  };

  return <RequisitionDetailClient requisition={serialized} isManager={isPrivileged(role)} />;
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, User } from "lucide-react";

export const metadata = { title: "Заявки на сбор — Magnifique" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлена",
  picking: "Сборка",
  done: "Собрана",
};

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "info" | "success"> = {
  draft: "secondary",
  sent: "warning",
  picking: "info",
  done: "success",
};

export default async function RequisitionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { role } = session.user;
  if (!["manager", "warehouse"].includes(role)) redirect("/events");

  const requisitions = await prisma.requisition.findMany({
    where: role === "warehouse"
      ? { status: { in: ["sent", "picking", "done"] as Prisma.EnumRequisitionStatusFilter["in"] } }
      : undefined,
    include: {
      event: { select: { id: true, title: true, starts_at: true, client: true } },
      assignee: { select: { id: true, full_name: true } },
      items: { select: { id: true, is_picked: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Заявки на сбор</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {role === "warehouse" ? "Заявки для комплектации" : "Все заявки по мероприятиям"}
        </p>
      </div>

      {requisitions.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Заявок пока нет</p>
          {role === "manager" && (
            <p className="text-sm mt-1">Создайте заявку на странице мероприятия во вкладке «Сбор»</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {requisitions.map((req) => {
          const total = req.items.length;
          const picked = req.items.filter((i) => i.is_picked).length;

          return (
            <Link key={req.id} href={`/requisitions/${req.id}`}>
              <div className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{req.event.title}</p>
                    {req.event.client && (
                      <p className="text-sm text-muted-foreground">{req.event.client}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[req.status]}>
                    {STATUS_LABELS[req.status]}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(req.event.starts_at), "d MMM yyyy", { locale: ru })}
                  </span>
                  {req.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {req.assignee.full_name}
                    </span>
                  )}
                  {total > 0 && (
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {picked}/{total} позиций
                    </span>
                  )}
                </div>

                {total > 0 && req.status !== "draft" && (
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.round((picked / total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

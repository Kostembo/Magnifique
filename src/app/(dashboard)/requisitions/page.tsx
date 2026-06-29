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
  if (!["manager", "warehouse", "owner", "admin"].includes(role)) redirect("/events");

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
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Заявки на сбор</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {role === "warehouse" ? "Заявки для комплектации" : "Все заявки по мероприятиям"}
        </p>
      </div>

      {requisitions.length === 0 && (
        <div className="rounded-3xl mq-hair p-10 text-center text-muted-foreground" style={{ background: "hsl(var(--card))" }}>
          <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Заявок пока нет</p>
          {role === "manager" && (
            <p className="text-sm mt-1">Создайте заявку на странице мероприятия во вкладке «Сбор»</p>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {requisitions.map((req) => {
          const total = req.items.length;
          const picked = req.items.filter((i) => i.is_picked).length;
          const pct = total > 0 ? picked / total : 0;

          return (
            <Link key={req.id} href={`/requisitions/${req.id}`} className="block">
              <div className="rounded-3xl mq-hair p-4 space-y-3 hover:bg-card/80 transition-colors cursor-pointer"
                style={{ background: "hsl(var(--card))" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-[15px] truncate">{req.event.title}</p>
                    {req.event.client && (
                      <p className="text-[13px] text-muted-foreground mt-0.5">{req.event.client}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[req.status]} className="shrink-0">
                    {STATUS_LABELS[req.status]}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(req.event.starts_at), "d MMM yyyy", { locale: ru })}
                  </span>
                  {req.assignee && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {req.assignee.full_name}
                    </span>
                  )}
                  {total > 0 && (
                    <span className="flex items-center gap-1.5 font-display font-bold tabular-nums"
                      style={{ color: pct >= 1 ? "hsl(var(--ok))" : pct > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                      <Package className="h-3.5 w-3.5" />
                      {picked}/{total}
                    </span>
                  )}
                </div>

                {total > 0 && req.status !== "draft" && (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(pct * 100)}%`,
                        background: pct >= 1 ? "hsl(var(--ok))" : "hsl(var(--primary))",
                      }}
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

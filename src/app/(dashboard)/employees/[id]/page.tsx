import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Pencil, Phone, MessageCircle } from "lucide-react";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const metadata = { title: "Сотрудник — Magnifique" };

const TIER_CHIP: Record<string, { background: string; color: string }> = {
  core:    { background: "hsl(270 50% 18%)", color: "hsl(270 65% 72%)" },
  regular: { background: "hsl(30 50% 16%)",  color: "hsl(30 70% 62%)" },
  trainee: { background: "hsl(143 55% 18%)", color: "hsl(143 60% 68%)" },
};

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) redirect("/");

  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true, full_name: true, phone: true, role: true, tier: true,
      photo_url: true, telegram: true, messenger_max: true,
      hourly_rate: true, min_pay_amount: true, min_pay_hours: true,
      created_at: true,
    },
  });

  if (!emp) notFound();

  const tierStyle = TIER_CHIP[emp.tier] ?? TIER_CHIP.regular;

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/employees" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Сотрудники
        </Link>
        <Button asChild size="sm" className="rounded-xl gap-2">
          <Link href={`/employees/${emp.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" /> Редактировать
          </Link>
        </Button>
      </div>

      <div className="rounded-3xl mq-hair p-6 space-y-5" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {emp.photo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
              : <User className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">{emp.full_name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-muted text-[12px] font-medium">
                {ROLE_LABELS[emp.role] ?? emp.role}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[12px] font-medium" style={tierStyle}>
                {TIER_LABELS[emp.tier] ?? emp.tier}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Row icon={<Phone className="h-4 w-4" />} label="Телефон" value={formatPhone(emp.phone)} />
          {emp.telegram && (
            <Row icon={<MessageCircle className="h-4 w-4" />} label="Telegram" value={emp.telegram} />
          )}
          {emp.messenger_max && (
            <Row icon={<MessageCircle className="h-4 w-4" />} label="Messenger Max" value={emp.messenger_max} />
          )}
        </div>

        {(emp.hourly_rate || emp.min_pay_amount) && (
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Оплата</p>
            {emp.hourly_rate && (
              <p className="text-sm">
                Ставка: <span className="font-semibold">{Number(emp.hourly_rate)} ₽/ч</span>
              </p>
            )}
            {emp.min_pay_amount && (
              <p className="text-sm">
                Минималка:{" "}
                <span className="font-semibold">{Number(emp.min_pay_amount)} ₽</span>
                {emp.min_pay_hours ? ` за ${emp.min_pay_hours} ч` : ""}
              </p>
            )}
          </div>
        )}

        <p className="text-[12px] text-muted-foreground border-t border-border pt-4">
          Добавлен {format(new Date(emp.created_at), "d MMMM yyyy", { locale: ru })}
        </p>
      </div>
    </div>
  );
}

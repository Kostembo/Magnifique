import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canViewPayroll } from "@/lib/roles";
import { format } from "date-fns";
import { PayrollList } from "./_components/payroll-list";

export const metadata = { title: "Зарплаты — Magnifique" };

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canViewPayroll(session.user.role ?? "")) redirect("/");

  const now = new Date();
  const month = format(now, "yyyy-MM");
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const entries = await prisma.timeEntry.findMany({
    where: { work_date: { gte: from, lt: to } },
    include: {
      employee: { select: { id: true, full_name: true, role: true } },
      event: { select: { id: true, title: true, starts_at: true } },
    },
    orderBy: [{ employee: { full_name: "asc" } }, { work_date: "asc" }],
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em] mb-6 md:text-center">Зарплаты</h1>
      <PayrollList initial={entries as PayrollEntry[]} initialMonth={month} />
    </div>
  );
}

export type PayrollEntry = {
  id: string;
  employee_id: string;
  event_id: string;
  work_date: Date | string;
  checked_in_at: Date | string | null;
  checked_out_at: Date | string | null;
  calculated_hours: unknown;
  calculated_pay: unknown;
  pay_status: "draft" | "confirmed" | "paid";
  pay_comment: string | null;
  employee: { id: string; full_name: string; role: string };
  event: { id: string; title: string; starts_at: Date | string };
};

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { EmployeeForm } from "../../_components/employee-form";

export const metadata = { title: "Редактировать сотрудника — Magnifique" };

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) redirect("/");

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true, full_name: true, phone: true, role: true,
      tier: true, passport_data_enc: true, photo_url: true,
      hourly_rate: true, min_pay_amount: true, min_pay_hours: true,
    },
  });

  if (!employee) notFound();

  const { passport_data_enc: _enc, photo_url, hourly_rate, min_pay_amount, min_pay_hours, ...rest } = employee;

  return (
    <EmployeeForm
      mode="edit"
      defaultValues={{
        ...rest,
        photo_url: photo_url ?? undefined,
        passport_data: "",
        hasPassportData: !!_enc,
        hourly_rate: hourly_rate ? Number(hourly_rate) : undefined,
        min_pay_amount: min_pay_amount ? Number(min_pay_amount) : undefined,
        min_pay_hours: min_pay_hours ?? undefined,
      }}
    />
  );
}

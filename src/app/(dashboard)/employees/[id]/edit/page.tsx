import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EmployeeForm } from "../../_components/employee-form";

export const metadata = { title: "Редактировать сотрудника — Magnifique" };

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") redirect("/");

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true, full_name: true, phone: true, role: true,
      tier: true, is_active: true, passport_data_enc: true, photo_url: true,
    },
  });

  if (!employee) notFound();

  const { passport_data_enc, photo_url, ...rest } = employee;

  return (
    <EmployeeForm
      mode="edit"
      defaultValues={{
        ...rest,
        photo_url: photo_url ?? undefined,
        passport_data: "",
      }}
    />
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EmployeesClient } from "./_components/employees-client";

export const metadata = { title: "Сотрудники — Magnifique" };

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") redirect("/");

  const employees = await prisma.employee.findMany({
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
    select: {
      id: true, full_name: true, phone: true, role: true,
      tier: true, is_active: true, created_at: true, photo_url: true,
    },
  });

  return <EmployeesClient initialEmployees={employees} />;
}

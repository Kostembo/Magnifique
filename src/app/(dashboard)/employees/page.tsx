import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPrivileged } from "@/lib/roles";
import { EmployeesClient } from "./_components/employees-client";

export const metadata = { title: "Сотрудники — Magnifique" };

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user || !isPrivileged(session.user.role ?? "")) redirect("/");

  const employees = await prisma.employee.findMany({
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
    select: {
      id: true, full_name: true, phone: true, role: true,
      tier: true, created_at: true, photo_url: true,
    },
  });

  return <EmployeesClient initialEmployees={employees} />;
}

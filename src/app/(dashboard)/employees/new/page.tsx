import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeForm } from "../_components/employee-form";

export const metadata = { title: "Новый сотрудник — Magnifique" };

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") redirect("/");

  return <EmployeeForm mode="create" />;
}

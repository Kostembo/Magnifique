import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  if (role === "manager") redirect("/employees");
  if (role === "warehouse") redirect("/requisitions");
  redirect("/events");
}

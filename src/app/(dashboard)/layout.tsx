import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-[100dvh] md:flex-row overflow-hidden">
      <Sidebar userName={session.user.name ?? "Сотрудник"} userRole={session.user.role} />
      <PullToRefresh>
        {children}
      </PullToRefresh>
    </div>
  );
}

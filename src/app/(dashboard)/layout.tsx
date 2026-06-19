import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-[100dvh] md:flex-row overflow-hidden">
      <Sidebar userName={session.user.name ?? "Сотрудник"} userRole={session.user.role} />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <MobileHeader userName={session.user.name ?? "Сотрудник"} />
        <PullToRefresh>
          {children}
        </PullToRefresh>
      </div>
    </div>
  );
}

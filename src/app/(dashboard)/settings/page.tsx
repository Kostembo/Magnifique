import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./_components/change-password-form";
import { PushSection } from "./_components/push-section";
import { LogoutButton } from "./_components/logout-button";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Управление аккаунтом</p>
      </div>
      <ThemeToggle />
      <PushSection />
      <ChangePasswordForm />
      <LogoutButton />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./_components/change-password-form";
import { PushSection } from "./_components/push-section";
import { LogoutButton } from "./_components/logout-button";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Управление аккаунтом</p>
      </div>
      <PushSection />
      <ChangePasswordForm />
      <LogoutButton />
    </div>
  );
}

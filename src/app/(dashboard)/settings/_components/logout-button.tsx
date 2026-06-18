"use client";

import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Button
      variant="destructive"
      className="w-full"
      disabled={loading}
      onClick={handleLogout}
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
      {loading ? "Выход…" : "Выйти из аккаунта"}
    </Button>
  );
}

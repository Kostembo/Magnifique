"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function PushSubscribeButton() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "idle");
    });
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey, // браузер принимает строку напрямую
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setStatus("subscribed");
      toast({ title: "Уведомления включены", variant: "success" });
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setStatus("denied");
        toast({ title: "Разрешение отклонено", description: "Разрешите уведомления в настройках браузера", variant: "destructive" });
      } else {
        setStatus("idle");
        toast({ title: "Ошибка подписки", variant: "destructive" });
      }
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
    await fetch("/api/push/subscribe", { method: "DELETE" });
    setStatus("idle");
    toast({ title: "Уведомления отключены" });
  }

  if (status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <Button variant="outline" size="sm" onClick={unsubscribe}>
        <BellOff className="h-4 w-4 mr-2" />
        Отключить уведомления
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={subscribe} disabled={status === "loading"}>
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      {status === "denied" ? "Уведомления запрещены" : "Включить уведомления"}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PushSubscribeButton } from "@/components/push/push-subscribe-button";
import { Bell, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PushSection() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  async function sendTest() {
    setSending(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Ошибка", variant: "destructive" });
      } else {
        toast({ title: "Тестовое уведомление отправлено", variant: "success" });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Push-уведомления
        </CardTitle>
        <CardDescription>
          Получайте уведомления о новых мероприятиях и изменениях
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PushSubscribeButton />
        <Button
          variant="ghost"
          size="sm"
          onClick={sendTest}
          disabled={sending}
          className="text-muted-foreground"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Отправить тестовое уведомление
        </Button>
      </CardContent>
    </Card>
  );
}

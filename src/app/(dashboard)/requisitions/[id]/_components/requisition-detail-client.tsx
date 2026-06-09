"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Package, Plus, Trash2, Check, Loader2, Send, PlayCircle, CheckCircle2,
} from "lucide-react";

type Item = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  is_picked: boolean;
};

type Requisition = {
  id: string;
  status: string;
  event: { id: string; title: string; starts_at: Date | string; client?: string | null };
  assignee?: { id: string; full_name: string } | null;
  items: Item[];
  sent_at?: Date | string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлена",
  picking: "Сборка",
  done: "Собрана",
};

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "info" | "success"> = {
  draft: "secondary",
  sent: "warning",
  picking: "info",
  done: "success",
};

interface Props {
  requisition: Requisition;
  isManager: boolean;
}

export function RequisitionDetailClient({ requisition: initial, isManager }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [req, setReq] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [addName, setAddName] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addUnit, setAddUnit] = useState("шт");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const total = req.items.length;
  const picked = req.items.filter((i) => i.is_picked).length;
  const allPicked = total > 0 && picked === total;

  async function changeStatus(status: "sent" | "picking" | "done") {
    const res = await fetch(`/api/requisitions/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setReq(data);
      toast({
        title: status === "sent" ? "Заявка отправлена на склад" : status === "picking" ? "Сборка начата" : "Заявка выполнена",
        variant: "success",
      });
      startTransition(() => router.refresh());
    } else {
      toast({ title: "Ошибка", description: data.error, variant: "destructive" });
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addQty) return;
    setAdding(true);
    const res = await fetch(`/api/requisitions/${req.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName.trim(), quantity: parseFloat(addQty), unit: addUnit }),
    });
    setAdding(false);
    if (res.ok) {
      const item = await res.json();
      setReq((prev) => ({ ...prev, items: [...prev.items, { ...item, quantity: item.quantity.toString() }] }));
      setAddName("");
      setAddQty("");
      setAddUnit("шт");
    } else {
      const data = await res.json();
      toast({ title: "Ошибка", description: data.error, variant: "destructive" });
    }
  }

  async function toggleItem(item: Item) {
    setTogglingId(item.id);
    const res = await fetch(`/api/requisitions/${req.id}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_picked: !item.is_picked }),
    });
    setTogglingId(null);
    if (res.ok) {
      setReq((prev) => ({
        ...prev,
        items: prev.items.map((i) => i.id === item.id ? { ...i, is_picked: !i.is_picked } : i),
      }));
    }
  }

  async function deleteItem(id: number) {
    setDeletingId(id);
    const res = await fetch(`/api/requisitions/${req.id}/items/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setReq((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    } else {
      const data = await res.json();
      toast({ title: "Ошибка", description: data.error, variant: "destructive" });
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Шапка */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/requisitions"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{req.event.title}</h1>
            <Badge variant={STATUS_VARIANT[req.status]}>{STATUS_LABELS[req.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(req.event.starts_at), "d MMMM yyyy", { locale: ru })}
            {req.event.client && ` · ${req.event.client}`}
          </p>
        </div>
      </div>

      {/* Прогресс */}
      {total > 0 && req.status !== "draft" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Собрано позиций</span>
            <span className="font-medium">{picked} / {total}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${total > 0 ? Math.round((picked / total) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Список позиций */}
      <div className="rounded-lg border bg-card divide-y">
        {req.items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <Package className="h-7 w-7 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Нет позиций. Добавьте инвентарь ниже.</p>
          </div>
        )}

        {req.items.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${item.is_picked ? "opacity-60" : ""}`}>
            {/* Чекбокс для склада в статусе picking */}
            {!isManager && req.status === "picking" && (
              <button
                onClick={() => toggleItem(item)}
                disabled={togglingId === item.id}
                className={`h-6 w-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  item.is_picked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground hover:border-primary"
                }`}
              >
                {togglingId === item.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : item.is_picked
                  ? <Check className="h-3.5 w-3.5" />
                  : null}
              </button>
            )}
            {/* Статус для просмотра */}
            {(isManager || req.status !== "picking") && req.status !== "draft" && (
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                item.is_picked ? "bg-primary border-primary text-primary-foreground" : "border-muted"
              }`}>
                {item.is_picked && <Check className="h-3 w-3" />}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.is_picked ? "line-through" : ""}`}>{item.name}</p>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              {item.quantity} {item.unit}
            </span>
            {isManager && req.status === "draft" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => deleteItem(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Форма добавления позиции (только менеджер, только черновик) */}
      {isManager && req.status === "draft" && (
        <form onSubmit={addItem} className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Добавить позицию</p>
          <div className="flex gap-2">
            <Input
              placeholder="Название"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Кол-во"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              className="w-24"
            />
            <Input
              placeholder="Ед."
              value={addUnit}
              onChange={(e) => setAddUnit(e.target.value)}
              className="w-16"
            />
            <Button type="submit" size="icon" disabled={adding || !addName.trim() || !addQty}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      )}

      {/* Кнопки действий */}
      <div className="flex flex-wrap gap-2">
        {isManager && req.status === "draft" && total > 0 && (
          <Button onClick={() => changeStatus("sent")} disabled={isPending} className="gap-2">
            <Send className="h-4 w-4" />
            Отправить на склад
          </Button>
        )}
        {!isManager && req.status === "sent" && (
          <Button onClick={() => changeStatus("picking")} disabled={isPending} className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Начать сборку
          </Button>
        )}
        {!isManager && req.status === "picking" && allPicked && (
          <Button onClick={() => changeStatus("done")} disabled={isPending} variant="default" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Завершить сборку
          </Button>
        )}
        {isManager && (
          <Button variant="outline" asChild>
            <Link href={`/events/${req.event.id}`}>К мероприятию</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

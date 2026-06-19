"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Plus, Trash2, Check, Loader2, Send, PlayCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { StaffBar, stagger, fadeUp } from "@/lib/motion";

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

type CatalogItem = { id: number; name: string; unit: string; category: string };

interface Props { requisition: Requisition; isManager: boolean; }

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
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);

  useEffect(() => {
    if (isManager && req.status === "draft") {
      fetch("/api/warehouse-items").then((r) => r.ok ? r.json() : []).then(setCatalog).catch(() => {});
    }
  }, [isManager, req.status]);

  const total = req.items.length;
  const picked = req.items.filter((i) => i.is_picked).length;
  const allPicked = total > 0 && picked === total;
  const pct = total > 0 ? picked / total : 0;

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
      setAddName(""); setAddQty(""); setAddUnit("шт");
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
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-2xl">
          <Link href="/requisitions"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
      </div>

      {/* Hero */}
      <div className="rounded-3xl mq-hair p-5" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-[22px] leading-tight tracking-[-0.02em] truncate">
              {req.event.title}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {format(new Date(req.event.starts_at), "d MMMM yyyy", { locale: ru })}
              {req.event.client && ` · ${req.event.client}`}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[req.status]} className="shrink-0 mt-0.5">
            {STATUS_LABELS[req.status]}
          </Badge>
        </div>

        {total > 0 && req.status !== "draft" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Собрано позиций</span>
              <span className="font-display font-bold tabular-nums"
                style={{ color: pct >= 1 ? "hsl(var(--ok))" : "hsl(var(--primary))" }}>
                {picked} / {total}
              </span>
            </div>
            <StaffBar value={pct} />
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="rounded-3xl mq-hair overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        {req.items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-7 w-7 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Нет позиций. Добавьте инвентарь ниже.</p>
          </div>
        )}

        <motion.div variants={stagger} initial="hidden" animate="show">
          {req.items.map((item, i) => (
            <motion.div key={item.id} variants={fadeUp} custom={i}
              className={`flex items-center gap-3 px-4 py-3.5 transition-opacity ${item.is_picked ? "opacity-50" : ""}`}
              style={{ borderBottom: "1px solid hsl(var(--border))" }}>

              {/* Чекбокс для склада в статусе picking */}
              {!isManager && req.status === "picking" && (
                <button
                  onClick={() => toggleItem(item)}
                  disabled={togglingId === item.id}
                  className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors min-h-0 min-w-0 h-auto w-auto ${
                    item.is_picked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                  style={{ height: 24, width: 24 }}
                >
                  {togglingId === item.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : item.is_picked ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              )}

              {/* Статус для просмотра */}
              {(isManager || req.status !== "picking") && req.status !== "draft" && (
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  item.is_picked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                }`}>
                  {item.is_picked && <Check className="h-3 w-3" />}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-medium ${item.is_picked ? "line-through" : ""}`}>{item.name}</p>
              </div>
              <span className="text-[13px] text-muted-foreground shrink-0 tabular-nums">
                {item.quantity} {item.unit}
              </span>
              {isManager && req.status === "draft" && (
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 rounded-xl min-h-0 min-w-0"
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Форма добавления (только менеджер, только черновик) */}
      {isManager && req.status === "draft" && (
        <form onSubmit={addItem} className="rounded-3xl mq-hair p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Добавить позицию</p>
          <div className="relative">
            <Input
              placeholder="Название..."
              value={addName}
              className="rounded-2xl"
              onChange={(e) => {
                const val = e.target.value;
                setAddName(val);
                if (val.length > 1) {
                  const q = val.toLowerCase();
                  setSuggestions(catalog.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6));
                } else {
                  setSuggestions([]);
                }
              }}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-popover rounded-2xl mq-hair shadow-lg mt-1 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => { setAddName(s.name); setAddUnit(s.unit); setSuggestions([]); }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted flex items-center justify-between gap-2 min-h-0"
                  >
                    <span>{s.name}</span>
                    <span className="text-muted-foreground text-xs shrink-0">{s.unit}{s.category ? ` · ${s.category}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="number" min="0.01" step="0.01" placeholder="Кол-во"
              value={addQty} onChange={(e) => setAddQty(e.target.value)}
              className="flex-1 rounded-2xl"
            />
            <Input
              placeholder="Ед." value={addUnit} onChange={(e) => setAddUnit(e.target.value)}
              className="w-20 rounded-2xl"
            />
            <Button type="submit" size="icon" className="rounded-2xl" disabled={adding || !addName.trim() || !addQty}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      )}

      {/* Кнопки действий */}
      <div className="flex flex-wrap gap-2">
        {isManager && req.status === "draft" && total > 0 && (
          <Button onClick={() => changeStatus("sent")} disabled={isPending} className="gap-2 rounded-xl">
            <Send className="h-4 w-4" />Отправить на склад
          </Button>
        )}
        {!isManager && req.status === "sent" && (
          <Button onClick={() => changeStatus("picking")} disabled={isPending} className="gap-2 rounded-xl">
            <PlayCircle className="h-4 w-4" />Начать сборку
          </Button>
        )}
        {!isManager && req.status === "picking" && allPicked && (
          <Button onClick={() => changeStatus("done")} disabled={isPending} className="gap-2 rounded-xl">
            <CheckCircle2 className="h-4 w-4" />Завершить сборку
          </Button>
        )}
        {isManager && (
          <Button variant="outline" asChild className="rounded-xl">
            <Link href={`/events/${req.event.id}`}>К мероприятию</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

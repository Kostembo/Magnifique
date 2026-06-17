"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface WarehouseItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  is_active: boolean;
  created_at: Date;
}

interface Props {
  initialItems: WarehouseItem[];
}

export function WarehouseItemsClient({ initialItems }: Props) {
  const [items, setItems] = useState<WarehouseItem[]>(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", category: "", unit: "шт" });

  function resetForm() {
    setForm({ name: "", category: "", unit: "шт" });
    setError(null);
  }

  async function handleAdd() {
    if (!form.name.trim()) {
      setError("Название обязательно");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/warehouse-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          unit: form.unit.trim() || "шт",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Ошибка сохранения");
      }
      const created: WarehouseItem = await res.json();
      setItems((prev) =>
        [...prev, created].sort((a, b) => {
          const catCmp = a.category.localeCompare(b.category, "ru");
          return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name, "ru");
        })
      );
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/warehouse-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // silently ignore — item stays in list
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = items.reduce<Record<string, WarehouseItem[]>>((acc, item) => {
    const key = item.category || "Без категории";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Каталог склада</h1>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить позицию
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Каталог пуст. Добавьте первую позицию.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Ед. изм.</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(grouped).map(([category, groupItems]) =>
                groupItems.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {idx === 0 ? (
                        <Badge variant="secondary">{category}</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.unit}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        aria-label="Удалить позицию"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая позиция</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="wi-name">Название *</Label>
              <Input
                id="wi-name"
                placeholder="Например: Тарелка плоская"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wi-category">Категория</Label>
              <Input
                id="wi-category"
                placeholder="Например: Посуда"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wi-unit">Единица измерения</Label>
              <Input
                id="wi-unit"
                placeholder="шт"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Сохранение..." : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

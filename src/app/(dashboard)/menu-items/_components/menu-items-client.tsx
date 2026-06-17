"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  is_active: boolean;
  created_at: Date;
};

interface Props {
  initialItems: MenuItem[];
}

const EMPTY_FORM = { name: "", category: "", unit: "порц" };

export function MenuItemsClient({ initialItems }: Props) {
  const { toast } = useToast();

  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowAdd(true);
  }

  function closeAdd() {
    setShowAdd(false);
    setForm(EMPTY_FORM);
  }

  async function handleAdd() {
    if (!form.name.trim()) {
      toast({ title: "Укажите название", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          unit: form.unit.trim() || "порц",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Ошибка", description: data.error ?? "Не удалось добавить позицию", variant: "destructive" });
        return;
      }
      const created: MenuItem = await res.json();
      setItems((prev) =>
        [...prev, created].sort((a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        )
      );
      toast({ title: "Позиция добавлена", variant: "success" });
      closeAdd();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Ошибка", description: data.error ?? "Не удалось удалить позицию", variant: "destructive" });
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Позиция удалена" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Каталог меню</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} позиций
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Ед. изм.</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  Каталог пуст — добавьте первую позицию
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.category
                    ? <Badge variant="outline">{item.category}</Badge>
                    : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    {deletingId === item.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4 text-destructive" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) closeAdd(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая позиция меню</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mi-name">Название *</Label>
              <Input
                id="mi-name"
                placeholder="Например: Стейк рибай"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mi-category">Категория</Label>
              <Input
                id="mi-category"
                placeholder="Например: Горячее, Закуски, Десерты"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mi-unit">Единица измерения</Label>
              <Input
                id="mi-unit"
                placeholder="порц"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAdd} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleAdd} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

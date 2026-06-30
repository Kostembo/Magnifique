"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";

type TemplateItem = { id: number; name: string; quantity: number; unit: string; note?: string | null };
type WarehouseItem = { id: number; name: string; quantity: number; unit: string };

type Template = {
  id: number;
  name: string;
  menu_items: TemplateItem[];
  warehouse_items: WarehouseItem[];
};

interface Props { initialTemplates: Template[] }

function ItemRow({
  item, onChange, onRemove,
}: {
  item: { name: string; quantity: number | string; unit: string; note?: string | null };
  onChange: (k: string, v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        className="flex-1 h-8 text-sm rounded-xl"
        placeholder="Название"
        value={item.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <Input
        className="w-20 h-8 text-sm rounded-xl"
        type="number"
        min={0.01}
        step={0.01}
        placeholder="Кол-во"
        value={item.quantity}
        onChange={(e) => onChange("quantity", e.target.value)}
      />
      <Input
        className="w-16 h-8 text-sm rounded-xl"
        placeholder="ед."
        value={item.unit}
        onChange={(e) => onChange("unit", e.target.value)}
      />
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}

function TemplateEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Template>;
  onSave: (data: { name: string; menu_items: object[]; warehouse_items: object[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [menuItems, setMenuItems] = useState<{ name: string; quantity: string; unit: string; note: string }[]>(
    initial?.menu_items?.map((i) => ({ name: i.name, quantity: String(i.quantity), unit: i.unit, note: i.note ?? "" })) ?? []
  );
  const [warehouseItems, setWarehouseItems] = useState<{ name: string; quantity: string; unit: string }[]>(
    initial?.warehouse_items?.map((i) => ({ name: i.name, quantity: String(i.quantity), unit: i.unit })) ?? []
  );
  const [saving, setSaving] = useState(false);

  const updateMenuItem = (i: number, k: string, v: string) => {
    setMenuItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  };
  const updateWarehouseItem = (i: number, k: string, v: string) => {
    setWarehouseItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  };

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      menu_items: menuItems.filter((i) => i.name).map((i) => ({
        name: i.name, quantity: Number(i.quantity) || 1, unit: i.unit || "порц", note: i.note || null,
      })),
      warehouse_items: warehouseItems.filter((i) => i.name).map((i) => ({
        name: i.name, quantity: Number(i.quantity) || 1, unit: i.unit || "шт",
      })),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-4 p-4 rounded-2xl mq-hair" style={{ background: "hsl(var(--card))" }}>
      <div className="space-y-1.5">
        <Label className="text-xs">Название шаблона *</Label>
        <Input
          className="rounded-xl"
          placeholder="Банкет на 100 персон"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Меню</p>
          <Button
            type="button" variant="outline" size="sm" className="h-7 rounded-xl gap-1 text-xs"
            onClick={() => setMenuItems((p) => [...p, { name: "", quantity: "1", unit: "порц", note: "" }])}
          >
            <Plus className="h-3 w-3" /> Добавить
          </Button>
        </div>
        {menuItems.length === 0 && <p className="text-xs text-muted-foreground">Нет позиций</p>}
        {menuItems.map((item, i) => (
          <ItemRow key={i} item={item} onChange={(k, v) => updateMenuItem(i, k, v)} onRemove={() => setMenuItems((p) => p.filter((_, idx) => idx !== i))} />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Склад</p>
          <Button
            type="button" variant="outline" size="sm" className="h-7 rounded-xl gap-1 text-xs"
            onClick={() => setWarehouseItems((p) => [...p, { name: "", quantity: "1", unit: "шт" }])}
          >
            <Plus className="h-3 w-3" /> Добавить
          </Button>
        </div>
        {warehouseItems.length === 0 && <p className="text-xs text-muted-foreground">Нет позиций</p>}
        {warehouseItems.map((item, i) => (
          <ItemRow key={i} item={item} onChange={(k, v) => updateWarehouseItem(i, k, v)} onRemove={() => setWarehouseItems((p) => p.filter((_, idx) => idx !== i))} />
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" className="rounded-xl" onClick={onCancel}>Отмена</Button>
        <Button className="rounded-xl gap-2" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
}

export function TemplatesClient({ initialTemplates }: Props) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState(initialTemplates);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function handleCreate(data: object) {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const t = await res.json();
      setTemplates((p) => [t, ...p]);
      setCreating(false);
      toast({ title: "Шаблон создан", variant: "success" });
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  }

  async function handleEdit(id: number, data: object) {
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const t = await res.json();
      setTemplates((p) => p.map((tmpl) => tmpl.id === id ? t : tmpl));
      setEditingId(null);
      toast({ title: "Шаблон обновлён", variant: "success" });
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((p) => p.filter((t) => t.id !== id));
      toast({ title: "Шаблон удалён", variant: "success" });
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em] md:text-center">Шаблоны</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Меню и склад для быстрого создания мероприятий</p>
        </div>
        {!creating && (
          <Button className="rounded-xl gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Создать
          </Button>
        )}
      </div>

      {creating && (
        <TemplateEditor
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {templates.length === 0 && !creating && (
        <p className="text-center text-muted-foreground py-16 text-sm">Нет шаблонов. Создайте первый.</p>
      )}

      <div className="space-y-3">
        {templates.map((t) =>
          editingId === t.id ? (
            <TemplateEditor
              key={t.id}
              initial={t}
              onSave={(data) => handleEdit(t.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={t.id} className="rounded-2xl mq-hair" style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-center justify-between p-4">
                <button
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <span className="font-semibold text-[15px]">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.menu_items.length} меню · {t.warehouse_items.length} склад
                  </span>
                  {expandedId === t.id
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />}
                </button>
                <div className="flex items-center gap-1 ml-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setEditingId(t.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => handleDelete(t.id)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              {expandedId === t.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {t.menu_items.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Меню</p>
                      <div className="space-y-1">
                        {t.menu_items.map((i) => (
                          <div key={i.id} className="flex justify-between text-sm">
                            <span>{i.name}</span>
                            <span className="text-muted-foreground tabular-nums">{i.quantity} {i.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {t.warehouse_items.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Склад</p>
                      <div className="space-y-1">
                        {t.warehouse_items.map((i) => (
                          <div key={i.id} className="flex justify-between text-sm">
                            <span>{i.name}</span>
                            <span className="text-muted-foreground tabular-nums">{i.quantity} {i.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

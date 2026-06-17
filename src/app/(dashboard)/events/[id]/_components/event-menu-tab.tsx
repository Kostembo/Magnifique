"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CatalogItem = { id: number; name: string; category: string; unit: string };
type MenuRow = { menu_item_id?: number | null; name: string; quantity: number; unit: string; note?: string | null };

interface Props {
  eventId: string;
  canEdit: boolean;
}

export function EventMenuTab({ eventId, canEdit }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState("порц");
  const [newNote, setNewNote] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);

  useEffect(() => {
    async function load() {
      const [menuRes, catalogRes] = await Promise.all([
        fetch(`/api/events/${eventId}/menu`),
        canEdit ? fetch("/api/menu-items") : Promise.resolve(null),
      ]);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setItems(data.map((r: Record<string, unknown>) => ({
          menu_item_id: r.menu_item_id as number | null,
          name: r.name as string,
          quantity: Number(r.quantity),
          unit: r.unit as string,
          note: r.note as string | null,
        })));
      }
      if (catalogRes?.ok) setCatalog(await catalogRes.json());
      setLoading(false);
    }
    load();
  }, [eventId, canEdit]);

  function handleNameChange(val: string) {
    setNewName(val);
    if (val.length > 1) {
      const q = val.toLowerCase();
      setSuggestions(catalog.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }

  function selectSuggestion(item: CatalogItem) {
    setNewName(item.name);
    setNewUnit(item.unit);
    setSuggestions([]);
  }

  function addRow() {
    if (!newName.trim()) return;
    const match = catalog.find((c) => c.name.toLowerCase() === newName.toLowerCase());
    setItems((prev) => [
      ...prev,
      { menu_item_id: match?.id ?? null, name: newName.trim(), quantity: parseFloat(newQty) || 1, unit: newUnit || "порц", note: newNote.trim() || null },
    ]);
    setNewName(""); setNewQty("1"); setNewNote("");
    setSuggestions([]);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (res.ok) toast({ title: "Меню сохранено", variant: "success" });
    else toast({ title: "Ошибка сохранения", variant: "destructive" });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground space-y-2">
          <ChefHat className="h-8 w-8 mx-auto opacity-40" />
          <p className="font-medium">{canEdit ? "Меню ещё не добавлено" : "Меню пока не сформировано"}</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Блюдо</th>
                <th className="text-left px-3 py-2 font-medium w-20">Кол-во</th>
                <th className="text-left px-3 py-2 font-medium w-20">Ед.</th>
                <th className="text-left px-3 py-2 font-medium">Заметка</th>
                {canEdit && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{item.note ?? "—"}</td>
                  {canEdit && (
                    <td className="px-2 py-2">
                      <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Добавить позицию</p>
          <div className="relative">
            <Input placeholder="Название блюда..." value={newName} onChange={(e) => handleNameChange(e.target.value)} />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-md shadow-md mt-1 overflow-hidden">
                {suggestions.map((s) => (
                  <button key={s.id} onClick={() => selectSuggestion(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2">
                    <span>{s.name}</span>
                    {s.category && <Badge variant="outline" className="text-xs shrink-0">{s.category}</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Кол-во" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-24" type="number" min="0.1" step="0.5" />
            <Input placeholder="Ед." value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-24" />
            <Input placeholder="Заметка (опц.)" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={addRow} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 mr-1.5" /> Добавить
            </Button>
            {items.length > 0 && (
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Сохранить меню
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

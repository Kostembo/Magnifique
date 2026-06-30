"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Trash2, LayoutTemplate, Check } from "lucide-react";
import Link from "next/link";
import { DateTimePicker } from "@/components/date-time-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const positionSchema = z.object({
  role: z.enum(["waiter", "cook", "warehouse"]),
  needed_count: z.coerce.number().int().min(1),
  reserved_for_core: z.coerce.number().int().min(0).default(0),
  priority_deadline: z.string().optional(),
});

type TemplateOption = { id: number; name: string; menu_items: { name: string }[]; warehouse_items: { name: string }[] };

const formSchema = z.object({
  title: z.string().min(1, "Укажите название"),
  client: z.string().optional(),
  location: z.string().optional(),
  guests_count: z.coerce.number().int().min(1).optional(),
  starts_at: z.string().min(1, "Укажите дату и время"),
  warehouse_time: z.string().optional(),
  venue_time: z.string().optional(),
  organizer_name: z.string().optional(),
  organizer_phone: z.string().optional(),
  positions: z.array(positionSchema).min(1, "Добавьте хотя бы одну позицию"),
});

type FormData = z.infer<typeof formSchema>;

const ROLE_OPTIONS = [
  { value: "cook", label: "Повара" },
  { value: "waiter", label: "Официанты" },
];

export function EventForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);

  async function openTemplates() {
    setTemplateDialogOpen(true);
    if (templates.length === 0) {
      setLoadingTemplates(true);
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
      setLoadingTemplates(false);
    }
  }

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positions: [{ role: "waiter", needed_count: 2, reserved_for_core: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "positions" });

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      template_id: selectedTemplateId ?? undefined,
      starts_at: new Date(data.starts_at).toISOString(),
      warehouse_time: data.warehouse_time ? new Date(data.warehouse_time).toISOString() : null,
      venue_time: data.venue_time ? new Date(data.venue_time).toISOString() : null,
      positions: data.positions.map((p) => ({
        ...p,
        priority_deadline: p.priority_deadline
          ? new Date(p.priority_deadline).toISOString()
          : null,
      })),
    };

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const event = await res.json();
      toast({ title: "Мероприятие создано", variant: "success" });
      router.push(`/events/${event.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Ошибка", description: err.error ?? "Что-то пошло не так", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-2xl font-semibold">Новое мероприятие</h1>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2" onClick={openTemplates}>
          <LayoutTemplate className="h-4 w-4" />
          {selectedTemplateName ?? "Шаблон"}
        </Button>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Выбрать шаблон</DialogTitle>
          </DialogHeader>
          {loadingTemplates && <p className="text-sm text-muted-foreground py-4 text-center">Загрузка...</p>}
          {!loadingTemplates && templates.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Нет шаблонов. Создайте их в разделе Шаблоны.</p>
          )}
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full text-left rounded-xl px-4 py-3 transition-colors flex items-center justify-between gap-3"
                style={{
                  background: selectedTemplateId === t.id ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                  border: selectedTemplateId === t.id ? "1.5px solid hsl(var(--primary))" : "1.5px solid transparent",
                }}
                onClick={() => {
                  setSelectedTemplateId(t.id);
                  setSelectedTemplateName(t.name);
                  setTemplateDialogOpen(false);
                }}
              >
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.menu_items.length} меню · {t.warehouse_items.length} склад
                  </p>
                </div>
                {selectedTemplateId === t.id && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
          {selectedTemplateId !== null && (
            <Button variant="ghost" size="sm" className="w-full rounded-xl text-muted-foreground"
              onClick={() => { setSelectedTemplateId(null); setSelectedTemplateName(null); setTemplateDialogOpen(false); }}>
              Без шаблона
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Основные данные */}
        <Card>
          <CardHeader><CardTitle className="text-base">Основные данные</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название *</Label>
              <Input id="title" placeholder="Корпоратив Иванов & партнёры" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Клиент</Label>
                <Input id="client" placeholder="Название компании" {...register("client")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Место</Label>
                <Input id="location" placeholder="Адрес или название площадки" {...register("location")} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizer_name">Организатор</Label>
                <Input id="organizer_name" placeholder="Имя организатора" {...register("organizer_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer_phone">Телефон организатора</Label>
                <Input id="organizer_phone" placeholder="+7 900 000-00-00" {...register("organizer_phone")} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Дата и время начала *</Label>
                <DateTimePicker
                  mode="datetime"
                  value={watch("starts_at") ?? ""}
                  onChange={(v) => setValue("starts_at", v, { shouldValidate: true })}
                />
                {errors.starts_at && <p className="text-sm text-destructive">{errors.starts_at.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests_count">Количество гостей</Label>
                <Input id="guests_count" type="number" min={1} placeholder="100" {...register("guests_count")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Время прибытия */}
        <Card>
          <CardHeader><CardTitle className="text-base">Время прибытия персонала</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse_time">Склад (сбор инвентаря)</Label>
                <DateTimePicker
                  mode="datetime"
                  value={watch("warehouse_time") ?? ""}
                  onChange={(v) => setValue("warehouse_time", v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue_time">Площадка (начало смены)</Label>
                <DateTimePicker
                  mode="datetime"
                  value={watch("venue_time") ?? ""}
                  onChange={(v) => setValue("venue_time", v)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Используется для автоматического расчёта рабочих часов при чек-ине
            </p>
          </CardContent>
        </Card>

        {/* Позиции */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Персонал</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ role: "waiter", needed_count: 1, reserved_for_core: 0 })}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Добавить роль
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.positions?.root && (
              <p className="text-sm text-destructive">{errors.positions.root.message}</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Позиция {index + 1}</p>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Роль *</Label>
                    <Select
                      defaultValue={field.role}
                      onValueChange={(v) => setValue(`positions.${index}.role`, v as FormData["positions"][number]["role"])}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Кол-во *</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-10"
                      {...register(`positions.${index}.needed_count`)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Слотов для костяка</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-10"
                      {...register(`positions.${index}.reserved_for_core`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Дедлайн костяка</Label>
                    <DateTimePicker
                      mode="datetime"
                      value={watch(`positions.${index}.priority_deadline`) ?? ""}
                      onChange={(v) => setValue(`positions.${index}.priority_deadline`, v)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href="/events">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать и запустить набор
          </Button>
        </div>
      </form>
    </div>
  );
}

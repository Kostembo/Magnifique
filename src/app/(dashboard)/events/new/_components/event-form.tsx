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
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const positionSchema = z.object({
  role: z.enum(["waiter", "cook", "warehouse"]),
  needed_count: z.coerce.number().int().min(1),
  reserved_for_core: z.coerce.number().int().min(0).default(0),
  priority_deadline: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Укажите название"),
  client: z.string().optional(),
  location: z.string().optional(),
  guests_count: z.coerce.number().int().min(1).optional(),
  starts_at: z.string().min(1, "Укажите дату и время"),
  warehouse_time: z.string().optional(),
  venue_time: z.string().optional(),
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/events"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">Новое мероприятие</h1>
      </div>

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
                <Label htmlFor="starts_at">Дата и время начала *</Label>
                <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
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
                <Input id="warehouse_time" type="datetime-local" {...register("warehouse_time")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue_time">Площадка (начало смены)</Label>
                <Input id="venue_time" type="datetime-local" {...register("venue_time")} />
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
                    <Input
                      type="datetime-local"
                      className="h-10"
                      {...register(`positions.${index}.priority_deadline`)}
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

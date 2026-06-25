"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DateTimePicker } from "@/components/date-time-picker";

const editSchema = z.object({
  title: z.string().min(1),
  client: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string().min(1),
  status: z.enum(["draft", "recruiting", "staffed", "done"]),
});

type FormData = z.infer<typeof editSchema>;

interface Props {
  event: {
    id: string;
    title: string;
    client?: string | null;
    location?: string | null;
    starts_at: Date;
    status: string;
  };
}

export function EventEditClient({ event }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: event.title,
      client: event.client ?? "",
      location: event.location ?? "",
      starts_at: format(new Date(event.starts_at), "yyyy-MM-dd'T'HH:mm"),
      status: event.status as FormData["status"],
    },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, starts_at: new Date(data.starts_at).toISOString() }),
    });

    if (res.ok) {
      toast({ title: "Изменения сохранены", variant: "success" });
      router.push(`/events/${event.id}`);
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/events/${event.id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">Редактировать мероприятие</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Основные данные</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Клиент</Label>
                <Input {...register("client")} />
              </div>
              <div className="space-y-2">
                <Label>Место</Label>
                <Input {...register("location")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата и время</Label>
                <DateTimePicker
                  mode="datetime"
                  value={watch("starts_at") ?? ""}
                  onChange={(v) => setValue("starts_at", v, { shouldValidate: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select
                  defaultValue={event.status}
                  onValueChange={(v) => setValue("status", v as FormData["status"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Черновик</SelectItem>
                    <SelectItem value="recruiting">Набор</SelectItem>
                    <SelectItem value="staffed">Укомплектовано</SelectItem>
                    <SelectItem value="done">Завершено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href={`/events/${event.id}`}>Отмена</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}

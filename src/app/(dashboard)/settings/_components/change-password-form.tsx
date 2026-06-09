"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";

const schema = z
  .object({
    current_password: z.string().min(1, "Введите текущий пароль"),
    new_password: z.string().min(6, "Минимум 6 символов"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Пароли не совпадают",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    const res = await fetch("/api/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    });
    setLoading(false);

    const json = await res.json();
    if (res.ok) {
      toast({ title: "Пароль успешно изменён", variant: "success" });
      reset();
    } else {
      toast({ title: "Ошибка", description: json.error, variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-medium">Смена пароля</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Текущий пароль</Label>
          <Input
            id="current_password"
            type="password"
            autoComplete="current-password"
            {...register("current_password")}
          />
          {errors.current_password && (
            <p className="text-xs text-destructive">{errors.current_password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new_password">Новый пароль</Label>
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            {...register("new_password")}
          />
          {errors.new_password && (
            <p className="text-xs text-destructive">{errors.new_password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Повторите новый пароль</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            {...register("confirm_password")}
          />
          {errors.confirm_password && (
            <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Сменить пароль
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, EyeOff, Camera, User } from "lucide-react";
import Link from "next/link";
import { ImageCropModal } from "./image-crop-modal";

const baseSchema = z.object({
  full_name: z.string().min(2, "Укажите ФИО"),
  phone: z.string().min(10, "Укажите телефон"),
  role: z.enum(["waiter", "cook", "warehouse", "manager", "sales", "chef", "owner", "admin"], {
    required_error: "Выберите роль",
  }),
  tier: z.enum(["core", "regular", "trainee"]),
  passport_data: z.string().optional(),
  photo_url: z.string().optional(),
  is_active: z.boolean().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, "Пароль минимум 6 символов"),
});

const editSchema = baseSchema.extend({
  password: z.string().min(6, "Пароль минимум 6 символов").optional().or(z.literal("")),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

interface EmployeeFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<EditData & { id: string; hasPassportData?: boolean }>;
}

export function EmployeeForm({ mode, defaultValues }: EmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultValues?.photo_url ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const schema = mode === "create" ? createSchema : editSchema;

  const { control, register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<EditData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? "",
      phone: defaultValues?.phone ?? "",
      role: defaultValues?.role,
      tier: defaultValues?.tier ?? "regular",
      passport_data: "",
      is_active: defaultValues?.is_active ?? true,
      password: "",
    },
  });

  const isActive = watch("is_active");

  function openCropper(file: File) {
    if (!defaultValues?.id) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  }

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function uploadPhoto(blob: Blob) {
    closeCropper();
    if (!defaultValues?.id) return;
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append("photo", blob, "photo.webp");
      const res = await fetch(`/api/employees/${defaultValues.id}/photo`, { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.photo_url + "?v=" + Date.now());
        toast({ title: "Фото обновлено", variant: "success" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Ошибка", description: err.error ?? "Не удалось загрузить фото", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Не удалось загрузить фото", variant: "destructive" });
    } finally {
      setPhotoUploading(false);
    }
  }

  async function onSubmit(data: EditData) {
    const payload: Record<string, unknown> = {
      full_name: data.full_name,
      phone: data.phone,
      role: data.role,
      tier: data.tier,
      is_active: data.is_active,
    };

    if (showPassport) payload.passport_data = data.passport_data ?? "";
    if (data.password) payload.password = data.password;

    const url = mode === "create" ? "/api/employees" : `/api/employees/${defaultValues?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast({
        title: mode === "create" ? "Сотрудник добавлен" : "Изменения сохранены",
        variant: "success",
      });
      router.push("/employees");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Ошибка",
        description: err.error ?? "Что-то пошло не так",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employees"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {mode === "create" ? "Добавить сотрудника" : "Редактировать сотрудника"}
        </h1>
      </div>

      {/* Фото */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div
          className="relative w-24 h-24 rounded-full border-2 border-dashed border-zinc-600 overflow-hidden bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors"
          onClick={() => photoInputRef.current?.click()}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Фото" className="w-full h-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-zinc-500" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {photoUploading
              ? <Loader2 className="h-6 w-6 text-white animate-spin" />
              : <Camera className="h-6 w-6 text-white" />}
          </div>
        </div>
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">Нажмите, чтобы загрузить фото</p>
        )}
        {mode === "create" && (
          <p className="text-xs text-muted-foreground">Фото можно добавить после создания</p>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={mode === "create"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) openCropper(file);
            e.target.value = "";
          }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Основные данные</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">ФИО *</Label>
              <Input id="full_name" placeholder="Иванов Иван Иванович" {...register("full_name")} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="phone"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Роль *</Label>
                <Select
                  defaultValue={defaultValues?.role}
                  onValueChange={(v) => setValue("role", v as EditData["role"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Официант / Бармен</SelectItem>
                    <SelectItem value="cook">Повар</SelectItem>
                    <SelectItem value="warehouse">Склад</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="sales">Менеджер по продажам</SelectItem>
                    <SelectItem value="chef">Шеф-повар</SelectItem>
                    <SelectItem value="owner">Владелец</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Уровень *</Label>
                <Select
                  defaultValue={defaultValues?.tier ?? "regular"}
                  onValueChange={(v) => setValue("tier", v as EditData["tier"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Костяк</SelectItem>
                    <SelectItem value="regular">Основной</SelectItem>
                    <SelectItem value="trainee">Стажёр</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Пароль</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="password">
              {mode === "create" ? "Пароль *" : "Новый пароль (оставьте пустым, чтобы не менять)"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "create" ? "new-password" : "off"}
                placeholder={mode === "create" ? "Минимум 6 символов" : "••••••"}
                className="pr-12"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-0 min-w-0 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Паспортные данные</CardTitle>
              <span className="text-xs text-muted-foreground bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5">
                Зашифровано AES-256
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPassport((v) => !v)}
                className="text-xs text-primary hover:underline min-h-0 min-w-0"
              >
                {showPassport
                  ? "Скрыть поле"
                  : defaultValues?.hasPassportData
                    ? "Изменить / удалить паспортные данные"
                    : "Ввести паспортные данные"}
              </button>
            </div>
            {showPassport && (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Серия, номер, дата выдачи, кем выдан..."
                {...register("passport_data")}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Хранятся в зашифрованном виде. Доступны только менеджеру.
              {mode === "edit" && showPassport && " Оставьте пустым, чтобы удалить паспортные данные."}
              {mode === "edit" && !showPassport && defaultValues?.hasPassportData && " Данные сохранены."}
            </p>
          </CardContent>
        </Card>

        {mode === "edit" && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="is_active"
                  checked={isActive ?? true}
                  onCheckedChange={(v) => setValue("is_active", Boolean(v))}
                />
                <Label htmlFor="is_active">Сотрудник активен</Label>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href="/employees">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Добавить сотрудника" : "Сохранить"}
          </Button>
        </div>
      </form>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onConfirm={uploadPhoto}
          onCancel={closeCropper}
        />
      )}
    </div>
  );
}

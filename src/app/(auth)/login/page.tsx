"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { TagCloudBg } from "@/components/layout/tag-cloud-bg";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(10, "Введите номер телефона"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginData) {
    setError(null);
    const result = await signIn("credentials", {
      phone: data.phone,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Неверный номер телефона или пароль");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <TagCloudBg />
    <div className="relative z-10 w-full max-w-sm md:max-w-2xl space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/logo?v=light"
          alt="Magnifique"
          className="h-24 md:h-48 w-auto"
          style={{ filter: "drop-shadow(0 0 20px #000) drop-shadow(0 0 20px #000) drop-shadow(0 0 16px #000) drop-shadow(0 0 10px #000)" }}
        />
      </div>

      {/* Form card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-12 shadow-2xl space-y-5 md:space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="phone" className="text-zinc-300 text-sm md:text-lg">Телефон</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="phone"
                    autoComplete="tel"
                    value={field.value}
                    onChange={field.onChange}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[hsl(38,62%,48%)] focus-visible:border-[hsl(38,62%,48%)] md:h-14 md:text-lg"
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm md:text-base text-red-400">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="password" className="text-zinc-300 text-sm md:text-lg">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-12 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[hsl(38,62%,48%)] focus-visible:border-[hsl(38,62%,48%)] md:h-14 md:text-lg"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 min-h-0 min-w-0 p-1 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm md:text-base text-red-400">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2 text-sm md:text-base text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2 md:h-14 md:text-lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
      </div>
      </div>
    </div>
  );
}

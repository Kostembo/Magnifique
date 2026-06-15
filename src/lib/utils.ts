import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ROLE_LABELS: Record<string, string> = {
  waiter: "Официант",
  cook: "Повар",
  warehouse: "Склад",
  manager: "Менеджер",
};

export const TIER_LABELS: Record<string, string> = {
  core: "Костяк",
  regular: "Основной",
  trainee: "Стажёр",
};

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    return "7" + digits.slice(1);
  }
  if (digits.startsWith("7") && digits.length === 11) {
    return digits;
  }
  if (digits.length === 10) {
    return "7" + digits;
  }
  return digits;
}

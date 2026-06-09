"use client";

import { forwardRef, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let local = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  local = local.slice(0, 10);

  if (!local) return "";

  // Separators only appear when digits FOLLOW them, so backspace works naturally
  let result = "+7 (" + local.slice(0, Math.min(3, local.length));
  if (local.length <= 3) return result;

  result += ") " + local.slice(3, Math.min(6, local.length));
  if (local.length <= 6) return result;

  result += "-" + local.slice(6, Math.min(8, local.length));
  if (local.length <= 8) return result;

  result += "-" + local.slice(8, 10);
  return result;
}

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "inputMode"> {
  onChange?: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value: externalValue = "", onChange, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLInputElement>(null);

    // Sync external value changes (default values in edit mode, form reset)
    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      const formatted = formatPhone(String(externalValue));
      if (el.value !== formatted) el.value = formatted;
    }, [externalValue]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const formatted = formatPhone(e.target.value);
      e.target.value = formatted; // mutate DOM directly — avoids Android keyboard lag
      onChange?.(formatted);
    }

    return (
      <Input
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type="tel"
        inputMode="tel"
        defaultValue={formatPhone(String(externalValue))}
        onChange={handleChange}
        placeholder="+7 (999) 000-00-00"
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

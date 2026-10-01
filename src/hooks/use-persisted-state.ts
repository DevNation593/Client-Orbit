"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function usePersistedState<T>(key: string, initialValue: T) {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const storageKey =
    "vantex:preference:" + String(tenantId ?? "default") + ":" + key;
  const [value, setValue] = useState<T>(initialValue);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    setLoadedKey(null);
    setValue(initialValue);
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) setValue(JSON.parse(saved) as T);
    } catch {
      // Storage can be disabled or contain an obsolete value.
    }
    setLoadedKey(storageKey);
  }, [initialValue, storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage can be disabled by the browser.
    }
  }, [loadedKey, storageKey, value]);

  return [value, setValue] as const;
}

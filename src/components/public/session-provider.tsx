"use client";
import { useEffect } from "react";
import { refreshSession } from "@/lib/api-fetch";
import { useAppStore } from "@/store/app-store";

export function SessionProvider() {
  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        let response = await fetch("/api/auth/me", { cache: "no-store" });
        let result = await response.json();
        if (!result.data && (await refreshSession())) {
          response = await fetch("/api/auth/me", { cache: "no-store" });
          result = await response.json();
        }
        if (active)
          useAppStore
            .getState()
            .setSession(result.success ? result.data : null);
      } catch {
        if (active) useAppStore.getState().setSession(null);
      }
    }
    const storage = (event: StorageEvent) => {
      if (event.key === "stone-session-ended")
        useAppStore.getState().setSession(null);
    };
    const expire = () => useAppStore.getState().setSession(null);
    const visible = () => {
      if (document.visibilityState === "visible") void hydrate();
    };
    window.addEventListener("storage", storage);
    void hydrate();
    const timer = window.setInterval(
      () => {
        if (useAppStore.getState().user) void hydrate();
      },
      10 * 60 * 1000,
    );
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("stone:session-expired", expire);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("stone:session-expired", expire);
      window.removeEventListener("storage", storage);
    };
  }, []);
  return null;
}

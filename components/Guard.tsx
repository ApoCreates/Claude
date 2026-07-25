"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/lib/prefs";

/** Redirects to the gate until a region has been chosen — the user must decide before entering. */
export function Guard({ children }: { children: React.ReactNode }) {
  const { region, ready } = usePrefs();
  const router = useRouter();

  useEffect(() => {
    if (ready && !region) router.replace("/");
  }, [ready, region, router]);

  if (!ready || !region) return null;
  return <>{children}</>;
}

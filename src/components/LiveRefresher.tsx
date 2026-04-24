"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresher({ matchId }: { matchId: string }) {
  const router = useRouter();
  useEffect(() => {
    const es = new EventSource(`/api/live/${matchId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === "update") router.refresh();
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      // auto-reconnect is handled by the browser; no action needed
    };
    return () => es.close();
  }, [matchId, router]);
  return null;
}

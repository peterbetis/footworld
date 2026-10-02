"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useOptimistic } from "react";

/**
 * Selected team, kept in the URL (`?team=<id>`) alongside the league.
 * The optimistic value makes the highlight move immediately on click,
 * before the navigation round-trip completes.
 */
export function useSelectedTeam() {
  const router = useRouter();
  const params = useSearchParams();
  const [selectedId, setOptimisticId] = useOptimistic(params.get("team"));

  const toggle = (teamId: string) => {
    const next = selectedId === teamId ? null : teamId;
    startTransition(() => {
      setOptimisticId(next);
      const query = new URLSearchParams(params);
      if (next) query.set("team", next);
      else query.delete("team");
      router.replace(`/?${query}`, { scroll: false });
    });
  };

  return { selectedId, toggle };
}

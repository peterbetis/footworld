"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useOptimistic } from "react";

/**
 * Selected team, kept in the URL by its readable name (`?team=real-madrid`)
 * alongside the league.
 * The optimistic value makes the highlight move immediately on click,
 * before the navigation round-trip completes.
 */
export function useSelectedTeam() {
  const router = useRouter();
  const params = useSearchParams();
  const [selectedSlug, setOptimisticSlug] = useOptimistic(params.get("team"));

  const toggle = (teamSlug: string) => {
    const next = selectedSlug === teamSlug ? null : teamSlug;
    startTransition(() => {
      setOptimisticSlug(next);
      const query = new URLSearchParams(params);
      if (next) query.set("team", next);
      else query.delete("team");
      router.replace(`/?${query}`, { scroll: false });
    });
  };

  return { selectedSlug, toggle };
}

import { useSyncExternalStore } from "react";

/**
 * The team row hovered in the teams sidebar (ESPN team id), shared with the leagues
 * map so it can show that club's crest in its hover state too.
 */
let hovered: string | null = null;
const listeners = new Set<() => void>();

export function setHoveredTeam(teamId: string | null) {
  if (teamId === hovered) return;
  hovered = teamId;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHoveredTeam() {
  return useSyncExternalStore(
    subscribe,
    () => hovered,
    () => null,
  );
}
